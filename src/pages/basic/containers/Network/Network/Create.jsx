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

import { isEmpty } from 'lodash';
import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import globalNetworkStore from 'stores/neutron/network';
import { subnetIpv6Tip } from 'resources/neutron/network';
import { ipValidate, nameTypeValidate } from 'utils/validate';

const { isIpCidr, isIPv6Cidr } = ipValidate;
const { nameValidateWithoutChinese } = nameTypeValidate;

// Basic-mode network create. Mirrors the required fields from the
// Advanced modal for a non-admin user: Network Name, Port Security
// Enabled, plus the subnet trio (Subnet Name, IP Version, CIDR) when
// "Create Subnet" is toggled. There are no table pickers in this form
// so nothing to swap to a searchable Select — kept as a single-page
// FormAction for consistency with the other Basic sections.
export class BasicNetworkCreate extends FormAction {
  static id = 'basic-network-create';

  static title = t('Create Network');

  static path = '/basic/network/network/create';

  static policy = ['create_network', 'create_subnet'];

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalNetworkStore;
  }

  get name() {
    return t('create network');
  }

  get listUrl() {
    return '/basic/network/network';
  }

  get nameForStateUpdate() {
    return ['create_subnet', 'ip_version'];
  }

  get defaultValue() {
    return {
      port_security_enabled: true,
      create_subnet: true,
      ip_version: 'ipv4',
    };
  }

  get isCreateSubnet() {
    return this.state.create_subnet === true;
  }

  get isIpv4() {
    return (this.state.ip_version || 'ipv4') === 'ipv4';
  }

  get formItems() {
    const createSubnet = this.isCreateSubnet;
    const { isIpv4 } = this;
    return [
      {
        name: 'name',
        label: t('Network Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      {
        name: 'port_security_enabled',
        label: t('Port Security Enabled'),
        type: 'switch',
        required: true,
      },
      {
        name: 'create_subnet',
        label: t('Create Subnet'),
        type: 'check',
      },
      {
        name: 'subnet_name',
        label: t('Subnet Name'),
        type: 'input',
        required: createSubnet,
        hidden: !createSubnet,
        validator: nameValidateWithoutChinese,
      },
      {
        name: 'ip_version',
        label: t('IP Version'),
        type: 'select',
        required: createSubnet,
        hidden: !createSubnet,
        options: [
          { label: 'ipv4', value: 'ipv4' },
          { label: 'ipv6', value: 'ipv6' },
        ],
      },
      {
        name: 'cidr',
        label: t('CIDR'),
        type: 'input',
        required: createSubnet,
        hidden: !createSubnet,
        placeholder: isIpv4 ? '192.168.0.0/24' : '1001:1001::/64',
        validator: (rule, value) => {
          if (!createSubnet && !value) {
            return Promise.resolve();
          }
          if (!isEmpty(value)) {
            const ok = isIpv4 ? isIpCidr(value) : isIPv6Cidr(value);
            if (!ok) {
              // eslint-disable-next-line prefer-promise-reject-errors
              return Promise.reject(new Error(t('Invalid: ') + t('CIDR')));
            }
          }
          return Promise.resolve();
        },
        tip: isIpv4
          ? t(
              'Use a private network address like 10.0.0.0/8, 172.16.0.0/12, or 192.168.0.0/16.'
            )
          : t('e.g. 2001:Db8::/48'),
      },
      {
        name: 'ipv6_ra_mode',
        label: t('Router Advertisements Mode'),
        type: 'select',
        hidden: !createSubnet || isIpv4,
        options: [
          { label: 'dhcpv6-stateful', value: 'dhcpv6-stateful' },
          { label: 'dhcpv6-stateless', value: 'dhcpv6-stateless' },
          { label: 'slaac', value: 'slaac' },
        ],
        tip: subnetIpv6Tip,
      },
      {
        name: 'ipv6_address_mode',
        label: t('IP Distribution Mode'),
        type: 'select',
        hidden: !createSubnet || isIpv4,
        options: [
          { label: 'dhcpv6-stateful', value: 'dhcpv6-stateful' },
          { label: 'dhcpv6-stateless', value: 'dhcpv6-stateless' },
          { label: 'slaac', value: 'slaac' },
        ],
        tip: subnetIpv6Tip,
      },
    ];
  }

  onSubmit = (values) => {
    const {
      name,
      port_security_enabled,
      create_subnet,
      subnet_name,
      ip_version,
      cidr,
      ipv6_ra_mode,
      ipv6_address_mode,
    } = values;

    const networkBody = {
      name,
      port_security_enabled,
    };

    const subnetBody = {
      create_subnet: !!create_subnet,
      ...(create_subnet
        ? {
            subnet_name,
            ip_version,
            cidr,
            enable_dhcp: true,
            ...(ip_version === 'ipv6' && ipv6_ra_mode ? { ipv6_ra_mode } : {}),
            ...(ip_version === 'ipv6' && ipv6_address_mode
              ? { ipv6_address_mode }
              : {}),
          }
        : {}),
    };

    // Notification is handled by BaseForm.onOk (success + error).
    return this.store.createAndMore(networkBody, subnetBody);
  };
}

export default inject('rootStore')(observer(BasicNetworkCreate));
