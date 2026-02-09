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

import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import Base from 'components/Form';
import { ImageStore } from 'stores/glance/image';
import globalKeypairStore from 'stores/nova/keypair';
import { FlavorStore } from 'src/stores/nova/flavor';
import { getImageColumns } from 'resources/glance/image';
import { getKeyPairHeader } from 'resources/nova/keypair';
import { getBaseSimpleFlavorColumns } from 'resources/magnum/template';
import { allSettled } from 'utils';

export class StepNodeSpec extends Base {
  init() {
    this.imageStore = new ImageStore();
    this.keyPairStore = globalKeypairStore;
    this.flavorStore = new FlavorStore();
    this.masterFlavorStore = new FlavorStore();
    this.getAllInitFunctions();
  }

  get title() {
    return t('Node Spec');
  }

  get name() {
    return t('Node Spec');
  }

  get isStep() {
    return true;
  }

  get isEdit() {
    return !!this.props.extra;
  }

  async getAllInitFunctions() {
    await allSettled([
      this.getImageList(),
      this.getKeypairs(),
      this.getFlavors(),
      this.getMasterFlavors(),
    ]);
    this.updateDefaultValue();
  }

  getImageList() {
    return this.imageStore.fetchList({ all_projects: this.hasAdminRole });
  }

  getKeypairs() {
    return this.keyPairStore.fetchList();
  }

  get keypairs() {
    return this.keyPairStore.list.data || [];
  }

  getFlavors() {
    return this.flavorStore.fetchList();
  }

  getMasterFlavors() {
    return this.masterFlavorStore.fetchList();
  }

  get flavors() {
    return toJS(this.flavorStore.list.data) || [];
  }

  get masterFlavors() {
    return toJS(this.masterFlavorStore.list.data) || [];
  }

  get acceptedImageOs() {
    const { context: { coe = '' } = {} } = this.props;
    let acceptedOs = [];
    if (coe === 'kubernetes') {
      acceptedOs = ['flatcar', 'ubuntu', 'fedora-coreos'];
    } else if (['swarm', 'swarm-mode'].includes(coe)) {
      acceptedOs = ['fedora-atomic'];
    } else {
      acceptedOs = ['ubuntu'];
    }
    return acceptedOs;
  }

  get imageColumns() {
    return getImageColumns(this);
  }

  get imageList() {
    return (this.imageStore.list.data || []).filter((it) => {
      const { originData: { os_distro, kube_version } = {} } = it;
      return (
        this.acceptedImageOs.includes(os_distro) &&
        kube_version !== undefined &&
        kube_version !== null &&
        kube_version !== ''
      );
    });
  }

  get defaultValue() {
    const values = {};

    if (this.isEdit) {
      const {
        extra: { image_id, keypair_id, flavor_id, master_flavor_id } = {},
      } = this.props;
      if (flavor_id) {
        values.flavor = {
          selectedRowKeys: [flavor_id],
          selectedRows: this.flavors.filter((it) => it.id === flavor_id),
        };
      }
      if (master_flavor_id) {
        values.masterFlavor = {
          selectedRowKeys: [master_flavor_id],
          selectedRows: this.masterFlavors.filter(
            (it) => it.id === master_flavor_id
          ),
        };
      }
      if (image_id) {
        values.images = { selectedRowKeys: [image_id] };
      }
      if (keypair_id) {
        values.keypair = { selectedRowKeys: [keypair_id] };
      }
    }
    return values;
  }

  get formItems() {
    const { initKeyPair } = this.state;

    return [
      {
        name: 'images',
        label: t('Image'),
        type: 'select-table',
        data: this.imageList,
        required: true,
        isLoading: this.imageStore.list.isLoading,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: this.imageColumns,
      },
      {
        name: 'keypair',
        label: t('Keypair'),
        type: 'select-table',
        data: this.keypairs,
        initValue: initKeyPair,
        isLoading: this.keyPairStore.list.isLoading,
        header: getKeyPairHeader(this),
        tip: t(
          'The SSH key is a way to remotely log in to the cluster instance. The cloud platform only helps to keep the public key. Please keep your private key properly.'
        ),
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: [
          {
            title: t('Name'),
            dataIndex: 'name',
          },
          {
            title: t('Fingerprint'),
            dataIndex: 'fingerprint',
          },
        ],
      },
      {
        name: 'flavor',
        label: t('Flavor of Nodes'),
        type: 'select-table',
        data: this.flavors,
        columns: getBaseSimpleFlavorColumns(this),
        isLoading: this.flavorStore.list.isLoading,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
      },
      {
        name: 'masterFlavor',
        label: t('Flavor of Master Nodes'),
        type: 'select-table',
        data: this.masterFlavors,
        columns: getBaseSimpleFlavorColumns(this),
        isLoading: this.masterFlavorStore.list.isLoading,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
      },
    ];
  }
}

export default inject('rootStore')(observer(StepNodeSpec));
