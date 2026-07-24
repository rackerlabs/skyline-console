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
import { FormAction } from 'containers/Action';
import { NetworkStore } from 'stores/neutron/network';
import { SecurityGroupStore } from 'stores/neutron/security-group';
import globalPortStore from 'stores/neutron/port-extension';

// Basic-mode virtual adapter (port) create. Mirrors the required
// fields from the Advanced form for a non-admin user: Name, Owned
// Network, Mac Address, and Security Group (when Port Security is
// enabled). Owned Network and Security Group tables are swapped for
// searchable Selects.
export class BasicPortCreate extends FormAction {
  static id = 'basic-port-create';

  static title = t('Create Virtual Adapter');

  static path = '/basic/network/port/create';

  static policy = 'create_port';

  static allowed = () => Promise.resolve(true);

  init() {
    this.networkStore = new NetworkStore();
    this.securityGroupStore = new SecurityGroupStore();
    this.loadResources();
  }

  async loadResources() {
    await Promise.all([
      this.networkStore.fetchList(),
      this.securityGroupStore.fetchList({
        project_id: this.currentProjectId,
      }),
    ]);
    this.updateDefaultValue();
  }

  get name() {
    return t('create virtual adapter');
  }

  get listUrl() {
    return '/basic/network/port';
  }

  get nameForStateUpdate() {
    return ['port_security_enabled', 'mac_address'];
  }

  get networks() {
    return (this.networkStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name || it.id,
    }));
  }

  get securityGroups() {
    return (this.securityGroupStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name,
    }));
  }

  get defaultValue() {
    return {
      port_security_enabled: true,
      mac_address: { type: 'auto' },
    };
  }

  get portSecurityEnabled() {
    return this.state.port_security_enabled !== false;
  }

  get formItems() {
    const searchable = {
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: t('Search'),
    };
    const showSecurityGroup = this.portSecurityEnabled;
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      {
        name: 'network_id',
        label: t('Owned Network'),
        type: 'select',
        required: true,
        loading: this.networkStore.list.isLoading,
        options: this.networks,
        ...searchable,
      },
      {
        name: 'mac_address',
        label: t('Mac Address'),
        type: 'mac-address',
        required: true,
        wrapperCol: { span: 16 },
      },
      {
        name: 'port_security_enabled',
        label: t('Port Security'),
        type: 'switch',
      },
      {
        name: 'security_groups',
        label: t('Security Group'),
        type: 'select',
        mode: 'multiple',
        required: showSecurityGroup,
        hidden: !showSecurityGroup,
        loading: this.securityGroupStore.list.isLoading,
        options: this.securityGroups,
        ...searchable,
      },
    ];
  }

  onSubmit = (values) => {
    const {
      name,
      network_id,
      mac_address: { type, mac } = {},
      port_security_enabled,
      security_groups = [],
    } = values;

    const data = {
      name,
      network_id,
      port_security_enabled,
      project_id: this.currentProjectId,
    };
    if (type === 'manual' && mac) {
      data.mac_address = mac;
    }
    if (port_security_enabled && security_groups.length > 0) {
      data.security_groups = security_groups;
    }

    // Notification is handled by BaseForm.onOk (success + error).
    return globalPortStore.create(data);
  };
}

export default inject('rootStore')(observer(BasicPortCreate));
