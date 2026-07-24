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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import { NetworkStore } from 'stores/neutron/network';
import globalSubnetStore from 'stores/neutron/subnet';
import { FloatingIpStore } from 'stores/neutron/floatingIp';
import { checkPolicyRule } from 'resources/skyline/policy';

// Basic-mode floating IP allocate. Includes every input from the
// Advanced non-admin form: Network, Specify Subnet toggle + Subnet,
// Batch Allocate + Count, Floating IP Address. Network is already a
// searchable Select in Advanced (no table), so nothing needs swapping.
export class BasicFloatingIpAllocate extends FormAction {
  static id = 'basic-fip-allocate';

  static title = t('Allocate IP');

  static path = '/basic/network/floatingip/create';

  static policy = 'create_floatingip';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = new FloatingIpStore();
    this.networkStore = new NetworkStore();
    this.state = {
      ...(this.state || {}),
      networks: [],
      subnets: [],
      selectedNetwork: null,
      selectedSubnet: null,
      enableSubnetSelection: false,
      batchAllocate: false,
    };
    this.getExternalNetworks();
  }

  async getExternalNetworks() {
    const networks = await this.networkStore.pureFetchList({
      'router:external': true,
    });
    this.setState({ networks }, () => this.updateDefaultValue());
  }

  get name() {
    return t('Allocate IP');
  }

  get listUrl() {
    return '/basic/network/floatingip';
  }

  get nameForStateUpdate() {
    return [
      'floating_network_id',
      'enable_subnet_selection',
      'batch_allocate',
      'subnet_id',
    ];
  }

  get defaultValue() {
    return { count: 2 };
  }

  get networkOptions() {
    return (this.state.networks || []).map((it) => ({
      label: it.name,
      value: it.id,
    }));
  }

  handleNetworkChange = async (networkId) => {
    const subnets = await globalSubnetStore.fetchList({
      network_id: networkId,
    });
    const subnetOptions = subnets.map((item) => ({
      allocation_pools: item.allocation_pools,
      ip_version: item.ip_version,
      value: item.id,
      label: item.name,
    }));
    this.setState(
      {
        subnets: subnetOptions,
        selectedNetwork: networkId,
        selectedSubnet: null,
      },
      () => {
        this.formRef?.current?.setFieldsValue({
          subnet_id: undefined,
          floating_ip_address: undefined,
        });
        const { enableSubnetSelection } = this.state;
        if (enableSubnetSelection && subnetOptions.length > 0) {
          const first = subnetOptions[0];
          this.formRef?.current?.setFieldsValue({ subnet_id: first });
          this.handleSubnetChange(first);
        }
      }
    );
  };

  handleSubnetChange = (option) => {
    this.setState({ selectedSubnet: option });
  };

  handleSubnetToggle = (checked) => {
    this.setState({ enableSubnetSelection: checked }, () => {
      if (!checked) {
        this.setState({ selectedSubnet: null });
        this.formRef?.current?.setFieldsValue({
          subnet_id: undefined,
          floating_ip_address: undefined,
        });
      } else {
        const { subnets = [] } = this.state;
        if (subnets.length > 0) {
          const first = subnets[0];
          this.formRef?.current?.setFieldsValue({ subnet_id: first });
          this.handleSubnetChange(first);
        }
      }
    });
  };

  checkCanSpecifyFloatingIpAddress() {
    return (
      checkPolicyRule('create_floatingip') &&
      checkPolicyRule('create_floatingip:floating_ip_address')
    );
  }

  get formItems() {
    const {
      selectedNetwork,
      subnets,
      selectedSubnet,
      enableSubnetSelection,
      batchAllocate,
    } = this.state;
    return [
      {
        name: 'floating_network_id',
        label: t('Network'),
        type: 'select',
        required: true,
        showSearch: true,
        optionFilterProp: 'label',
        autoSelectFirst: true,
        options: this.networkOptions,
        onChange: this.handleNetworkChange,
      },
      {
        name: 'enable_subnet_selection',
        label: t('Owned Subnet'),
        type: 'check',
        content: t('Specify subnet manually'),
        onChange: this.handleSubnetToggle,
        display: !!selectedNetwork && subnets.length > 0,
      },
      {
        name: 'subnet_id',
        label: t('Owned Subnet'),
        type: 'select',
        options: subnets,
        isWrappedValue: true,
        onChange: (option) => this.handleSubnetChange(option),
        hidden: !selectedNetwork || !enableSubnetSelection,
        extra: selectedSubnet && (
          <>
            <span>{t('Allocation Pools')}</span>
            {selectedSubnet.allocation_pools.map((pool, index) => (
              <div key={`pool.start.${index}`}>
                {pool.start}--{pool.end}
              </div>
            ))}
          </>
        ),
      },
      {
        name: 'batch_allocate',
        label: t('Batch Allocate'),
        type: 'check',
        onChange: (e) => this.setState({ batchAllocate: e }),
      },
      {
        name: 'count',
        label: t('Count'),
        type: 'input-int',
        min: 1,
        required: true,
        hidden: !batchAllocate,
      },
      {
        name: 'floating_ip_address',
        label: t('Floating IP Address'),
        type: 'ip-input',
        version: selectedSubnet && (selectedSubnet.ip_version || 4),
        hidden: !selectedSubnet || batchAllocate,
        display: this.checkCanSpecifyFloatingIpAddress(),
        extra: t('Only available when a subnet is selected'),
      },
    ];
  }

  onSubmit = (values) => {
    const {
      floating_network_id,
      subnet_id,
      batch_allocate,
      count,
      floating_ip_address,
    } = values;

    const data = {
      floating_network_id,
      project_id: this.currentProjectId,
    };
    if (subnet_id) {
      data.subnet_id = subnet_id.value;
    }
    if (floating_ip_address) {
      data.floating_ip_address = floating_ip_address;
    }
    // Notification is handled by BaseForm.onOk (success + error).
    if (batch_allocate) {
      // Batch allocation: don't pin an address.
      delete data.floating_ip_address;
      const promises = [];
      for (let i = 0; i < count; i += 1) {
        promises.push(this.store.create(data));
      }
      return Promise.all(promises);
    }
    return this.store.create(data);
  };
}

export default inject('rootStore')(observer(BasicFloatingIpAllocate));
