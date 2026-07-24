// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import globalServerStore from 'stores/nova/instance';
import globalImageStore from 'stores/glance/image';
import globalFlavorStore from 'stores/nova/flavor';
import globalKeypairStore from 'stores/nova/keypair';
import globalNetworkStore from 'stores/neutron/network';
import globalSecurityGroupStore from 'stores/neutron/security-group';
import globalInstanceSnapshotStore from 'stores/glance/instance-snapshot';
import globalAvailabilityZoneStore from 'stores/nova/zone';
import globalVolumeTypeStore from 'stores/cinder/volume-type';
import { VolumeStore } from 'stores/cinder/volume';
import { PortStore } from 'stores/neutron/port-extension';
import {
  canImageCreateInstance,
  getImageOS,
  imageOS,
} from 'resources/glance/image';
import { canCreateInstance as canVolumeCreateInstance } from 'resources/cinder/volume';
import {
  volumeTypes,
  getDefaultVolumeTypeOption,
  getMinVolumeSizeFromType,
} from 'resources/cinder/snapshot';
import { isBlazarInternalAvailabilityZone } from 'resources/blazar/reservation';
import { getPasswordOtherRule } from 'utils/validate';
import { getUserData } from 'resources/nova/instance';

// Single-page Basic instance create. Mirrors every required field
// from the Advanced flow (BaseStep + NetworkStep + SystemStep) using
// the same field names and labels so behaviour matches 1:1. Table
// pickers are the only thing swapped — for searchable Selects (same
// pattern as Blazar's flavor reservation form).
export class BasicInstanceCreate extends FormAction {
  static id = 'basic-instance-create';

  static title = t('Create Instance');

  static path = '/basic/compute/instance/create';

  static policy = [
    'os_compute_api:servers:create',
    'os_compute_api:os-availability-zone:list',
  ];

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalServerStore;
    this.imageStore = globalImageStore;
    this.flavorStore = globalFlavorStore;
    this.keypairStore = globalKeypairStore;
    this.networkStore = globalNetworkStore;
    this.securityGroupStore = globalSecurityGroupStore;
    this.instanceSnapshotStore = globalInstanceSnapshotStore;
    this.volumeStore = new VolumeStore();
    this.volumeTypeStore = globalVolumeTypeStore;
    this.portStore = new PortStore();
    this.zoneStore = globalAvailabilityZoneStore;
    this.loadResources();
  }

  async loadResources() {
    const requests = [
      this.zoneStore.fetchListWithoutDetail(),
      this.imageStore.fetchList({ all_projects: false }),
      this.flavorStore.fetchList(),
      this.keypairStore.fetchList(),
      this.networkStore.fetchList(),
      this.securityGroupStore.fetchList({
        project_id: this.currentProjectId,
      }),
      this.portStore.fetchList({
        project_id: this.currentProjectId,
        status: 'DOWN',
      }),
      this.instanceSnapshotStore.fetchList(),
    ];
    if (this.enableCinder) {
      requests.push(
        this.volumeStore.fetchList({
          sortKey: 'bootable',
          sortOrder: 'ascend',
        })
      );
      requests.push(this.volumeTypeStore.fetchList());
    }
    await Promise.all(requests);
    this.updateDefaultValue();
  }

  get name() {
    return t('Create instance');
  }

  get listUrl() {
    return '/basic/compute/instance';
  }

  get enableCinder() {
    return this.props.rootStore.checkEndpoint('cinder');
  }

  get nameForStateUpdate() {
    // image / instanceSnapshot are watched so the flavor list re-filters
    // when the source picture changes (min disk / min RAM come from
    // whichever one is currently selected).
    return [
      'source',
      'image',
      'instanceSnapshot',
      'loginType',
      'bootFromVolume',
      'networks',
      'ports',
    ];
  }

  // ---------- Option lists ----------

  get availableZones() {
    return (this.zoneStore.list.data || [])
      .filter((it) => it.zoneState && it.zoneState.available)
      .filter((it) => !isBlazarInternalAvailabilityZone(it.zoneName))
      .map((it) => ({ value: it.zoneName, label: it.zoneName }));
  }

  get sourceTypes() {
    const types = [
      { value: 'image', label: t('Image') },
      { value: 'instanceSnapshot', label: t('Instance Snapshot') },
    ];
    if (this.enableCinder) {
      types.push({ value: 'bootableVolume', label: t('Bootable Volume') });
    }
    return types;
  }

  get images() {
    return (this.imageStore.list.data || [])
      .filter((it) => canImageCreateInstance(it))
      .map((it) => {
        const os = getImageOS(it);
        const osLabel = imageOS[os] || os || '';
        return {
          value: it.id,
          label: osLabel ? `${it.name} · ${osLabel}` : it.name,
        };
      });
  }

  get snapshots() {
    return (this.instanceSnapshotStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name || it.id,
    }));
  }

  get bootableVolumes() {
    return (this.volumeStore.list.data || [])
      .filter((it) => canVolumeCreateInstance(it))
      .map((it) => ({
        value: it.id,
        label: `${it.name || it.id} · ${it.size} GiB`,
      }));
  }

  // Full detail for the picked image / snapshot so we can compute the
  // flavor's minimum disk and memory requirements — same logic used by
  // FlavorSelectTable in the Advanced flow.
  get selectedImage() {
    if (!this.isImageSource) return null;
    const id = this.state.image;
    if (!id) return null;
    return (this.imageStore.list.data || []).find((it) => it.id === id) || null;
  }

  get selectedSnapshot() {
    if (!this.isSnapshotSource) return null;
    const id = this.state.instanceSnapshot;
    if (!id) return null;
    return (
      (this.instanceSnapshotStore.list.data || []).find((it) => it.id === id) ||
      null
    );
  }

  // Minimum disk (in GiB) a flavor must have to fit the picked source.
  // For image: max(min_disk, ceil(size / 1024^3), ceil(virtual_size /
  // 1024^3)). For snapshot: min_disk.
  get flavorMinDisk() {
    const src = this.selectedImage || this.selectedSnapshot;
    if (!src) return 0;
    const { min_disk = 0, size = 0, virtual_size = 0 } = src;
    const sizeGiB = Math.ceil(size / 1024 / 1024 / 1024);
    const virtualGiB = Math.ceil(virtual_size / 1024 / 1024 / 1024);
    return Math.max(min_disk, sizeGiB, virtualGiB);
  }

  // Minimum RAM (in GiB) a flavor must have.
  get flavorMinMemory() {
    const src = this.selectedImage || this.selectedSnapshot;
    if (!src) return 0;
    const { min_ram = 0 } = src;
    return Math.ceil(min_ram / 1024);
  }

  get flavors() {
    const minDisk = this.flavorMinDisk;
    const minMemory = this.flavorMinMemory;
    const { bootFromVolume } = this;
    return (this.flavorStore.list.data || [])
      .filter((it) => {
        // Must have enough RAM.
        const flavorRamGiB = Math.ceil(it.ram / 1024);
        if (minMemory > 0 && flavorRamGiB < minMemory) {
          return false;
        }
        // For image/snapshot boot on flavor local disk, the flavor's
        // disk must fit the source. When booting from a new volume the
        // volume size is what matters, so this check is skipped.
        if (!bootFromVolume && minDisk > 0 && it.disk < minDisk) {
          return false;
        }
        return true;
      })
      .map((it) => ({
        value: it.id,
        label: `${it.name} · ${it.vcpus} vCPU · ${
          it.ram >= 1024 ? `${Math.round(it.ram / 1024)} GiB` : `${it.ram} MiB`
        } RAM · ${it.disk} GiB`,
      }));
  }

  get keypairs() {
    return (toJS(this.keypairStore.list.data) || []).map((it) => ({
      value: it.name,
      label: it.name,
    }));
  }

  get networks() {
    return (this.networkStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name || it.id,
    }));
  }

  get ports() {
    return (this.portStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name ? `${it.name} (${it.id.slice(0, 8)})` : it.id,
    }));
  }

  get securityGroups() {
    return (this.securityGroupStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name,
    }));
  }

  // Volume type options for the Boot Disk (instance-volume) input.
  get volumeTypeOptions() {
    return volumeTypes();
  }

  // ---------- Defaults ----------

  get defaultSystemDisk() {
    const defaultType = getDefaultVolumeTypeOption();
    const disk = {
      size: defaultType ? getMinVolumeSizeFromType(defaultType) : 1,
      deleteType: 0,
    };
    if (defaultType) {
      disk.type = defaultType.value;
      disk.typeOption = defaultType;
    }
    return disk;
  }

  get defaultValue() {
    const zones = this.availableZones;
    return {
      project: this.currentProjectName,
      availableZone: zones[0]?.value,
      source: 'image',
      bootFromVolume: false,
      loginType: 'keypair',
      systemDisk: this.defaultSystemDisk,
    };
  }

  // ---------- Derived state ----------

  get currentSource() {
    return this.state.source || 'image';
  }

  get isImageSource() {
    return this.currentSource === 'image';
  }

  get isSnapshotSource() {
    return this.currentSource === 'instanceSnapshot';
  }

  get isVolumeSource() {
    return this.currentSource === 'bootableVolume';
  }

  get isPasswordLogin() {
    return this.state.loginType === 'password';
  }

  get bootFromVolume() {
    return this.state.bootFromVolume === true;
  }

  get showBootFromVolume() {
    return this.enableCinder && (this.isImageSource || this.isSnapshotSource);
  }

  get showBootDisk() {
    return this.showBootFromVolume && this.bootFromVolume;
  }

  get hasNetworkSelected() {
    const value = this.state.networks;
    return Array.isArray(value) && value.length > 0;
  }

  get hasPortSelected() {
    const value = this.state.ports;
    return Array.isArray(value) && value.length > 0;
  }

  get passwordRule() {
    return getPasswordOtherRule('password', 'instance');
  }

  get confirmPasswordRule() {
    return getPasswordOtherRule('confirmPassword', 'instance');
  }

  // Drop the picked flavor if the newly picked image / snapshot pushes
  // the min disk or memory above the flavor's specs.
  syncFlavorAgainstSource = () => {
    const current = this.formRef?.current?.getFieldValue('flavor');
    if (!current) return;
    const stillOk = this.flavors.some((it) => it.value === current);
    if (!stillOk) {
      this.formRef?.current?.setFieldsValue({ flavor: undefined });
    }
  };

  onSourceChange = () => {
    // Radio changes state via nameForStateUpdate; also reset flavor.
    setTimeout(this.syncFlavorAgainstSource, 0);
  };

  onImageOrSnapshotChange = () => {
    setTimeout(this.syncFlavorAgainstSource, 0);
  };

  checkSystemDisk = (rule, value) => {
    const { size, type } = value || {};
    if (!type) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('');
    }
    if (!size || size < 1) {
      return Promise.reject(new Error(t('Please set the boot disk size!')));
    }
    return Promise.resolve();
  };

  // ---------- Form items ----------

  get formItems() {
    const searchable = {
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: t('Search'),
    };
    const showSecurityGroup = this.hasNetworkSelected || this.hasPortSelected;
    const networkRequired = !this.hasPortSelected;
    const portRequired = !this.hasNetworkSelected;
    const passwordLogin = this.isPasswordLogin;

    return [
      {
        name: 'availableZone',
        label: t('Availability Zone'),
        type: 'select',
        required: true,
        options: this.availableZones,
        disabled: true,
        showSearch: false,
        placeholder: t('Please select'),
        tip: t(
          'A logical grouping of compute hosts that controls where instances are deployed. Availability zones help isolate workloads and improve fault tolerance.'
        ),
      },
      { type: 'divider' },
      {
        name: 'source',
        label: t('Boot Source'),
        type: 'radio',
        required: true,
        options: this.sourceTypes,
        onChange: this.onSourceChange,
        tip: t(
          'The boot source is a template used to create an instance. You can choose an image or a bootable volume.'
        ),
      },
      {
        name: 'image',
        label: t('Operating System'),
        type: 'select',
        required: this.isImageSource,
        hidden: !this.isImageSource,
        loading: this.imageStore.list.isLoading,
        options: this.images,
        onChange: this.onImageOrSnapshotChange,
        ...searchable,
      },
      {
        name: 'instanceSnapshot',
        label: t('Instance Snapshot'),
        type: 'select',
        required: this.isSnapshotSource,
        hidden: !this.isSnapshotSource,
        loading: this.instanceSnapshotStore.list.isLoading,
        options: this.snapshots,
        onChange: this.onImageOrSnapshotChange,
        ...searchable,
      },
      {
        name: 'bootableVolume',
        label: t('Bootable Volume'),
        type: 'select',
        required: this.isVolumeSource,
        hidden: !this.isVolumeSource,
        loading: this.volumeStore.list.isLoading,
        options: this.bootableVolumes,
        ...searchable,
      },
      { type: 'divider' },
      {
        name: 'bootFromVolume',
        label: t('Boot From Volume'),
        type: 'radio',
        required: this.showBootFromVolume,
        hidden: !this.showBootFromVolume,
        options: [
          { value: true, label: t('Yes') },
          { value: false, label: t('No') },
        ],
        tip: t(
          'When set to Yes, a new boot volume is created from the selected image and the instance boots from that volume. When set to No, the instance boots from the image on the flavor local disk and no boot volume is created.'
        ),
      },
      {
        name: 'systemDisk',
        label: t('Boot Disk'),
        type: 'instance-volume',
        options: this.volumeTypeOptions,
        required: this.showBootDisk,
        hidden: !this.showBootDisk,
        validator: this.checkSystemDisk,
        minSize: 1,
        extra: t('Disk size is limited by the min disk of flavor, image, etc.'),
        tip: t(
          'The boot disk stores the operating system. When booting from an image, you can create a new volume and set its type and size here.'
        ),
      },
      { type: 'divider' },
      {
        name: 'flavor',
        label: t('Instance Resources'),
        type: 'select',
        required: true,
        loading: this.flavorStore.list.isLoading,
        options: this.flavors,
        ...searchable,
        extra:
          !this.flavorStore.list.isLoading &&
          (this.flavorStore.list.data || []).length > 0 &&
          this.flavors.length === 0
            ? t(
                "No Flavor satisfies Image's Disk and Memory requirements. Please select another image."
              )
            : undefined,
      },
      { type: 'divider' },
      {
        name: 'networks',
        label: t('Networks'),
        type: 'select',
        mode: 'multiple',
        required: networkRequired,
        loading: this.networkStore.list.isLoading,
        options: this.networks,
        ...searchable,
        placeholder: t('Select one or more networks'),
      },
      {
        name: 'ports',
        label: t('Ports'),
        type: 'select',
        mode: 'multiple',
        required: portRequired,
        loading: this.portStore.list.isLoading,
        options: this.ports,
        ...searchable,
        placeholder: t('Select one or more ports'),
        tip: t(
          'Ports provide extra communication channels to your instances. Choose either networks or ports (a port executes its own security group rules).'
        ),
      },
      {
        name: 'securityGroup',
        label: t('Security Group'),
        type: 'select',
        mode: 'multiple',
        required: showSecurityGroup,
        hidden: !showSecurityGroup,
        loading: this.securityGroupStore.list.isLoading,
        options: this.securityGroups,
        ...searchable,
      },
      { type: 'divider' },
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        isInstance: true,
      },
      {
        name: 'loginType',
        label: t('Login Type'),
        type: 'radio',
        required: true,
        options: [
          { value: 'keypair', label: t('Keypair') },
          { value: 'password', label: t('Password') },
        ],
      },
      {
        name: 'username',
        label: t('Login Name'),
        type: 'input',
        required: passwordLogin,
        hidden: !passwordLogin,
        tip: t(
          'Whether the Login Name can be used is up to the feasible configuration of cloud-init or cloudbase-init service in the image.'
        ),
      },
      {
        name: 'keypair',
        label: t('Keypair'),
        type: 'select',
        required: !passwordLogin,
        hidden: passwordLogin,
        loading: this.keypairStore.list.isLoading,
        options: this.keypairs,
        ...searchable,
        tip: t(
          'The SSH key is a way to remotely log in to the instance. The cloud platform only helps to keep the public key.'
        ),
      },
      {
        name: 'password',
        label: t('Login Password'),
        type: 'input-password',
        required: passwordLogin,
        hidden: !passwordLogin,
        otherRule: this.passwordRule,
      },
      {
        name: 'confirmPassword',
        label: t('Confirm Password'),
        type: 'input-password',
        required: passwordLogin,
        hidden: !passwordLogin,
        otherRule: this.confirmPasswordRule,
      },
    ];
  }

  // ---------- Submit ----------

  onSubmit = (submitValues) => {
    const {
      name,
      availableZone,
      source,
      image,
      instanceSnapshot,
      bootableVolume,
      bootFromVolume,
      systemDisk = {},
      flavor,
      networks = [],
      ports = [],
      securityGroup = [],
      loginType,
      username,
      keypair,
      password,
    } = submitValues;

    const networkList = [
      ...(networks || []).map((id) => ({ uuid: id })),
      ...(ports || []).map((id) => ({ port: id })),
    ];

    const server = {
      name,
      availability_zone: availableZone,
      flavorRef: flavor,
      networks: networkList,
    };

    if (source === 'bootableVolume') {
      // Boot straight from an existing volume.
      server.block_device_mapping_v2 = [
        {
          boot_index: 0,
          uuid: bootableVolume,
          source_type: 'volume',
          destination_type: 'volume',
          delete_on_termination: false,
        },
      ];
    } else {
      const srcId = source === 'image' ? image : instanceSnapshot;
      if (bootFromVolume) {
        // Match Advanced's block_device_mapping_v2 shape exactly:
        // volume_type + delete_on_termination come from the composite
        // Boot Disk (instance-volume) input.
        const { type, size, deleteType } = systemDisk;
        server.block_device_mapping_v2 = [
          {
            boot_index: 0,
            uuid: srcId,
            source_type: 'image',
            destination_type: 'volume',
            volume_size: size,
            volume_type: type,
            delete_on_termination: deleteType === 1,
          },
        ];
      } else {
        server.imageRef = srcId;
      }
    }

    if (securityGroup.length > 0) {
      server.security_groups = securityGroup.map((id) => ({ name: id }));
    }

    if (loginType === 'keypair') {
      server.key_name = keypair;
    } else {
      server.adminPass = password;
      server.user_data = btoa(getUserData(password, '', username || 'root'));
    }

    // Notification is handled by BaseForm.onOk (success + error).
    return this.store.create({ server });
  };
}

export default inject('rootStore')(observer(BasicInstanceCreate));
