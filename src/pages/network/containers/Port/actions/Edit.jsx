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
import { ModalAction } from 'containers/Action';
import globalPortStore from 'stores/neutron/port-extension';
import { checkPolicyRule } from 'resources/skyline/policy';

const portTypes =
  'normal,macvtap,direct,baremetal,direct-physical,virtio-forwarder,smart-nic';

const portTypeItems = portTypes.split(',').map((item) => ({
  label: item,
  value: item,
}));

const manualMacOption = {
  label: t('Manual input'),
  value: 'manual',
};

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export class Edit extends ModalAction {
  static id = 'edit-virtual-adapter';

  static title = t('Edit');

  static buttonText = t('Edit');

  static policy = 'update_port';

  get canEditMacAddress() {
    return checkPolicyRule('update_port:mac_address');
  }

  get showNotice() {
    if (this.suppressSuccessNotice) {
      this.suppressSuccessNotice = false;
      return false;
    }
    return true;
  }

  get defaultValue() {
    const { item } = this.props;
    return {
      name: item.name || '',
      description: item.description || '',
      ...(this.canEditMacAddress
        ? {
            mac_address: {
              type: 'manual',
              mac: item.mac_address,
            },
          }
        : {}),
      'binding:vnic_type': item.binding_vnic_type,
      more: false,
    };
  }

  static allowed = () => Promise.resolve(true);

  onSubmit = (values) => {
    const { item: { id } = {}, item } = this.props;
    const {
      name,
      description,
      mac_address: { type, mac } = {},
      'binding:vnic_type': vnicType,
      more,
    } = values;

    const data = {};
    if (normalizeOptionalString(name) !== normalizeOptionalString(item.name)) {
      data.name = name;
    }
    if (
      normalizeOptionalString(description) !==
      normalizeOptionalString(item.description)
    ) {
      data.description = description;
    }
    if (
      this.canEditMacAddress &&
      type === 'manual' &&
      mac &&
      mac !== item.mac_address
    ) {
      data.mac_address = mac;
    }
    if (more && vnicType !== item.binding_vnic_type) {
      data['binding:vnic_type'] = vnicType;
    }

    if (Object.keys(data).length === 0) {
      this.suppressSuccessNotice = true;
      return Promise.resolve();
    }
    return globalPortStore.update({ id }, data);
  };

  get macAddressFormItem() {
    const { item } = this.props;
    if (this.canEditMacAddress) {
      return {
        name: 'mac_address',
        label: t('Mac Address'),
        wrapperCol: { span: 16 },
        type: 'mac-address',
        required: true,
        options: [manualMacOption],
      };
    }
    return {
      name: 'mac_address',
      label: t('Mac Address'),
      type: 'label',
      content: item.mac_address || '-',
    };
  }

  get formItems() {
    const { more } = this.state;

    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      this.macAddressFormItem,
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      {
        name: 'more',
        label: t('Advanced Options'),
        type: 'more',
      },
      {
        name: 'binding:vnic_type',
        label: t('Port Type'),
        type: 'select',
        required: true,
        options: portTypeItems,
        hidden: !more,
      },
    ];
  }
}

export default inject('rootStore')(observer(Edit));
