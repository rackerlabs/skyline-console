import React from 'react';
import { Spin } from 'antd';
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
import InstanceVolume from 'components/FormItem/InstanceVolume';
import {
  canImageCreateInstance,
  getImageOS,
  getImageSystemTabs,
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
    // Gate the form behind a spinner until the option lists / quota
    // / volume-types have all landed and defaultValue can seed the
    // fields for real.
    this.state = { ...(this.state || {}), resourcesLoading: true };
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
    try {
      await Promise.all(requests);
    } finally {
      this.setState({ resourcesLoading: false });
      this.updateDefaultValue();
    }
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
    // whichever one is currently selected). imageOsFilter drives the
    // Operating System dropdown's option list.
    return [
      'source',
      'imageOsFilter',
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

  // OS filter dropdown — same tabs Advanced uses on its select-table.
  // Only shows OS values that have at least one active image.
  get osFilterOptions() {
    const data = this.imageStore.list.data || [];
    const active = data.filter(
      (it) => it.status === 'active' && canImageCreateInstance(it)
    );
    return (getImageSystemTabs() || [])
      .filter((tab) => active.some((image) => getImageOS(image) === tab.value))
      .map((tab) => ({ value: tab.value, label: tab.label }));
  }

  // Image list filtered by the current OS selection.
  get images() {
    const osFilter = this.state.imageOsFilter;
    return (this.imageStore.list.data || [])
      .filter((it) => canImageCreateInstance(it))
      .filter((it) => (osFilter ? getImageOS(it) === osFilter : true))
      .map((it) => ({ value: it.id, label: it.name }));
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

  // Default template for a new Data Disk row (deleteType 1 = delete
  // the volume when the instance is deleted, same as Advanced's data
  // disk default).
  get defaultDataDisk() {
    const defaultType = getDefaultVolumeTypeOption();
    const disk = {
      size: defaultType ? getMinVolumeSizeFromType(defaultType) : 1,
      deleteType: 1,
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
      // Default to booting from a fresh volume — most users want a
      // persistent boot disk, and Advanced also nudges users this way.
      bootFromVolume: true,
      loginType: 'keypair',
      systemDisk: this.defaultSystemDisk,
      // No data disks by default.
      dataDisk: [],
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

  // Raw rows for the currently picked networks / ports. Used to check
  // `port_security_enabled` before showing the Security Group field —
  // same rule Advanced enforces in NetworkStep.showSecurityGroups.
  get selectedNetworkRows() {
    const ids = this.state.networks;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const data = this.networkStore.list.data || [];
    return ids.map((id) => data.find((n) => n.id === id)).filter(Boolean);
  }

  get selectedPortRows() {
    const ids = this.state.ports;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const data = this.portStore.list.data || [];
    return ids.map((id) => data.find((p) => p.id === id)).filter(Boolean);
  }

  // Match Advanced NetworkStep.showSecurityGroups:
  //  - at least one network or port picked, AND
  //  - none of them have port_security_enabled === false.
  get showSecurityGroup() {
    const nets = this.selectedNetworkRows;
    const ports = this.selectedPortRows;
    if (nets.length === 0 && ports.length === 0) return false;
    if (nets.some((it) => it.port_security_enabled === false)) return false;
    if (ports.some((it) => it.port_security_enabled === false)) return false;
    return true;
  }

  get passwordRule() {
    return getPasswordOtherRule('password', 'instance');
  }

  get confirmPasswordRule() {
    return getPasswordOtherRule('confirmPassword', 'instance');
  }

  // Minimum Boot Disk size (GiB). Matches Advanced's
  // getSystemDiskMinSize: max of (1, volume-type's
  // provisioning:min_vol_size, image min_disk, ceil(image.size/1024^3),
  // ceil(image.virtual_size/1024^3), snapshot min_disk).
  getBootDiskMinSize = (typeOption, imageOverride) => {
    const currentDisk = this.formRef?.current?.getFieldValue('systemDisk');
    const effectiveTypeOption =
      typeOption || currentDisk?.typeOption || getDefaultVolumeTypeOption();
    const raw =
      effectiveTypeOption?.originData?.extra_specs?.[
        'provisioning:min_vol_size'
      ];
    let minSize = 1;
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed)) {
        minSize = Math.max(minSize, parsed);
      }
    }
    const image =
      imageOverride !== undefined ? imageOverride : this.selectedImage;
    if (image) {
      const { min_disk = 0, size = 0, virtual_size = 0 } = image;
      const sizeGiB = Math.ceil(size / 1024 / 1024 / 1024);
      const virtualGiB = Math.ceil(virtual_size / 1024 / 1024 / 1024);
      minSize = Math.max(minSize, min_disk, sizeGiB, virtualGiB);
    }
    if (this.isSnapshotSource && this.selectedSnapshot) {
      minSize = Math.max(minSize, this.selectedSnapshot.min_disk || 0, 1);
    }
    return minSize;
  };

  // Bump the Boot Disk size up whenever the picked image/snapshot pushes
  // the minimum above the currently entered value. Called after source /
  // OS / OS Type / Instance Snapshot changes.
  syncBootDiskAgainstSource = () => {
    if (!this.bootFromVolume) return;
    const current = this.formRef?.current?.getFieldValue('systemDisk');
    if (!current) return;
    const nextMin = this.getBootDiskMinSize(current.typeOption);
    if (!current.size || current.size < nextMin) {
      this.formRef?.current?.setFieldsValue({
        systemDisk: { ...current, size: nextMin },
      });
    }
  };

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
    // Radio changes state via nameForStateUpdate; also reset flavor +
    // recompute boot disk min.
    setTimeout(() => {
      this.syncFlavorAgainstSource();
      this.syncBootDiskAgainstSource();
    }, 0);
  };

  onImageOrSnapshotChange = () => {
    setTimeout(() => {
      this.syncFlavorAgainstSource();
      this.syncBootDiskAgainstSource();
    }, 0);
  };

  // OS filter changed — the previously picked image may not belong to
  // the new OS. Clear it so the user has to re-pick, and reset the
  // flavor list + boot disk min.
  onOsFilterChange = () => {
    this.formRef?.current?.setFieldsValue({ image: undefined });
    setTimeout(() => {
      this.syncFlavorAgainstSource();
      this.syncBootDiskAgainstSource();
    }, 0);
  };

  checkSystemDisk = (rule, value) => {
    const { size, type, typeOption } = value || {};
    if (!type) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('');
    }
    const minSize = this.getBootDiskMinSize(typeOption);
    if (!size) {
      return Promise.reject(new Error(t('Please set the boot disk size!')));
    }
    if (size < minSize) {
      return Promise.reject(
        new Error(
          t('Please set a size no less than {minSize} GiB!', { minSize })
        )
      );
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
    const { showSecurityGroup } = this;
    const networkRequired = !this.hasPortSelected;
    const portRequired = !this.hasNetworkSelected;
    const passwordLogin = this.isPasswordLogin;

    return [
      // ---------------- Base Config ----------------
      // Matches Advanced's "Base Config" step. Availability Zone is
      // not shown in Basic — the first available zone is picked
      // automatically in defaultValue and read on submit.
      { name: 'baseTitle', label: t('Base Config'), type: 'title' },
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
      // Advanced shows an OS filter as tabs above the image table.
      // Basic replaces that with a dropdown so users pick the OS first,
      // then narrow down to a specific image (Type). Matches Advanced's
      // OS filter + image list behavior.
      {
        name: 'imageOsFilter',
        label: t('Operating System'),
        type: 'select',
        required: this.isImageSource,
        hidden: !this.isImageSource,
        loading: this.imageStore.list.isLoading,
        options: this.osFilterOptions,
        onChange: this.onOsFilterChange,
        autoSelectFirst: true,
        ...searchable,
      },
      {
        name: 'image',
        label: t('OS Type'),
        type: 'select',
        required: this.isImageSource,
        hidden: !this.isImageSource,
        loading: this.imageStore.list.isLoading,
        options: this.images,
        onChange: this.onImageOrSnapshotChange,
        autoSelectFirst: true,
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
        autoSelectFirst: true,
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
        autoSelectFirst: true,
        ...searchable,
      },
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
        // Same math Advanced uses — max of volume-type min,
        // image min_disk, image size / virtual_size (in GiB), 1.
        minSize: this.getBootDiskMinSize(),
        getSizeForTypeChange: (typeOption) =>
          this.getBootDiskMinSize(typeOption),
        dependencies: ['image', 'instanceSnapshot', 'bootFromVolume'],
        extra: t('Disk size is limited by the min disk of flavor, image, etc.'),
        tip: t(
          'The boot disk stores the operating system. When booting from an image, you can create a new volume and set its type and size here.'
        ),
      },
      // Data disks — matches Advanced's add-select of extra volumes.
      // Shown when Cinder is available and we're booting an
      // image/snapshot (bootable-volume source doesn't need them).
      {
        name: 'dataDisk',
        label: t('Data Disk'),
        type: 'add-select',
        options: this.volumeTypeOptions,
        defaultItemValue: this.defaultDataDisk,
        itemComponent: InstanceVolume,
        minCount: 0,
        addTextTips: t('Data Disks'),
        addText: t('Add Data Disks'),
        hidden: !this.enableCinder || this.isVolumeSource,
        display: this.enableCinder,
        tip: t(
          'Additional volumes attached to the instance for data storage. You can add multiple disks and configure type, size, and delete behavior for each.'
        ),
        extra: t(
          'Too many disks mounted on the instance will affect the read and write performance. It is recommended not to exceed 16 disks.'
        ),
      },
      {
        name: 'flavor',
        label: t('Instance Resources'),
        type: 'select',
        required: true,
        loading: this.flavorStore.list.isLoading,
        options: this.flavors,
        autoSelectFirst: true,
        ...searchable,
        tip: t('Choose a flavor based on your source'),
        extra:
          !this.flavorStore.list.isLoading &&
          (this.flavorStore.list.data || []).length > 0 &&
          this.flavors.length === 0
            ? t(
                "No Flavor satisfies Image's Disk and Memory requirements. Please select another image."
              )
            : undefined,
      },
      // ---------------- Network Config ----------------
      // Matches Advanced's "Network Config" step.
      { name: 'networkDivider', type: 'divider' },
      { name: 'networkTitle', label: t('Network Config'), type: 'title' },
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
      // ---------------- System Config ----------------
      // Matches Advanced's "System Config" step.
      { name: 'systemDivider', type: 'divider' },
      { name: 'systemTitle', label: t('System Config'), type: 'title' },
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
        autoSelectFirst: true,
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
      dataDisk = [],
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
      // Availability Zone is auto-picked (no visible input in Basic).
      // Use whatever defaultValue seeded, otherwise fall back to the
      // first available zone on the store.
      availability_zone: availableZone || this.availableZones[0]?.value,
      flavorRef: flavor,
      networks: networkList,
    };

    // Turn each Data Disk row into a block_device_mapping_v2 entry.
    // Matches Advanced's dataDisk → block_device_mapping_v2 mapping.
    const dataDiskMappings = (dataDisk || [])
      .map((it) => {
        const { size, type, deleteType } = it?.value || {};
        if (!type || !size) return null;
        return {
          source_type: 'blank',
          destination_type: 'volume',
          volume_size: size,
          volume_type: type,
          delete_on_termination: deleteType === 1,
        };
      })
      .filter(Boolean);

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
        ...dataDiskMappings,
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
          ...dataDiskMappings,
        ];
      } else {
        server.imageRef = srcId;
        if (dataDiskMappings.length > 0) {
          server.block_device_mapping_v2 = dataDiskMappings;
        }
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

  render() {
    // Render the base form always; overlay a spinner on top until the
    // option lists / volume types / quota have all loaded. This keeps
    // the form scaffold visible (labels, sections) instead of a blank
    // screen and just guards user input while defaults settle.
    return (
      <Spin
        spinning={this.state.resourcesLoading}
        size="large"
        tip={t('Loading…')}
      >
        {super.render()}
      </Spin>
    );
  }
}

export default inject('rootStore')(observer(BasicInstanceCreate));
