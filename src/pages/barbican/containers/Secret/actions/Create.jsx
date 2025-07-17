// Copyright 2024 99cloud
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
import globalSecretsStore from 'stores/barbican/secrets';
import globalOrdersStore from 'stores/barbican/orders';
import moment from 'moment';

export class CreateSecret extends ModalAction {
  static id = 'create-secret';

  static title = t('Create Secret');

  static policy = ['secrets:post', 'orders:post'];

  static allowed = () => Promise.resolve(true);

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  init() {
    this.secretsStore = globalSecretsStore;
    this.ordersStore = globalOrdersStore;
  }

  get name() {
    return t('Create Secret');
  }

  get nameForStateUpdate() {
    return ['creationType', 'secret_type', 'algorithm'];
  }

  onSecretTypeChange = (value) => {
    // Update bit length when secret type changes
    let newBitLength;
    let newAlgorithm;

    if (value === 'symmetric') {
      newBitLength = 256;
      newAlgorithm = 'aes'; // Default symmetric algorithm
    } else if (value === 'asymmetric') {
      newBitLength = 2048;
      newAlgorithm = 'rsa'; // Default asymmetric algorithm
    }

    // Update the form field value using the form's setFieldsValue method
    if (this.formRef.current) {
      this.formRef.current.setFieldsValue({
        secret_type: value,
        bit_length: newBitLength,
        algorithm: newAlgorithm,
      });
    }
  };

  get defaultValue() {
    return {
      creationType: 'direct',
      name: '',
      payload: '',
      payload_content_type: 'text/plain',
      algorithm: 'aes', // Default algorithm for symmetric keys
      expiration: '',
      domain: '',
      secret_type: 'symmetric',
      bit_length: 256, // Default for symmetric keys
    };
  }

  get creationTypeOptions() {
    return [
      {
        label: t('Create Secret Directly'),
        value: 'direct',
        tip: t('Create a secret with your own payload content'),
      },
      {
        label: t('Create Secret via Order'),
        value: 'order',
        tip: t(
          'Create a secret through barbican order (for certificates, keys, etc.)'
        ),
      },
    ];
  }

  get secretTypeOptions() {
    return [
      {
        label: t('Symmetric Key'),
        value: 'symmetric',
      },
      {
        label: t('Asymmetric Key'),
        value: 'asymmetric',
      },
    ];
  }

  get algorithmOptions() {
    const { secret_type } = this.state;

    if (secret_type === 'symmetric') {
      return [
        {
          label: 'AES',
          value: 'aes',
        },
        {
          label: 'DES',
          value: 'des',
        },
        {
          label: '3DES',
          value: '3des',
        },
      ];
    }

    if (secret_type === 'asymmetric') {
      return [
        {
          label: 'RSA',
          value: 'rsa',
        },
        {
          label: 'DSA',
          value: 'dsa',
        },
      ];
    }

    return [];
  }

  get bitLengthOptions() {
    const { secret_type } = this.state;

    if (secret_type === 'symmetric') {
      return [
        { label: '128', value: 128 },
        { label: '192', value: 192 },
        { label: '256', value: 256 },
      ];
    }

    if (secret_type === 'asymmetric') {
      return [
        { label: '1024', value: 1024 },
        { label: '2048', value: 2048 },
        { label: '4096', value: 4096 },
      ];
    }

    return [];
  }

  get formItems() {
    const { creationType, secret_type } = this.state;
    const isDirect = creationType === 'direct';
    const isOrder = creationType === 'order';

    const baseItems = [
      {
        name: 'creationType',
        label: t('Creation Method'),
        type: 'radio',
        options: this.creationTypeOptions,
        required: true,
      },
      {
        name: 'name',
        label: t('Secret Name'),
        type: 'input-name',
        required: isDirect, // Required for direct creation, optional for orders
        withoutChinese: true,
        tip: isOrder
          ? t('Optional. If not provided, a name will be auto-generated')
          : undefined,
      },
    ];

    if (isDirect) {
      return [
        ...baseItems,
        {
          name: 'payload',
          label: t('Secret Payload'),
          type: 'textarea',
          required: true,
          rows: 6,
          placeholder: t('Enter the secret content'),
          tip: t('The actual secret data to be stored'),
        },
        {
          name: 'payload_content_type',
          label: t('Content Type'),
          type: 'input',
          required: true,
          tip: t(
            'e.g. text/plain, application/octet-stream, application/x-pkcs12'
          ),
        },
        {
          name: 'algorithm',
          label: t('Algorithm'),
          type: 'input',
          required: false,
          tip: t('Optional. e.g. AES, RSA, DSA'),
        },
        {
          name: 'expiration',
          label: t('Expiration Date'),
          type: 'date-picker',
          showToday: false,
          disabledDate: (current) => current && current <= moment().endOf('d'),
          tip: t('Optional. When the secret should expire'),
        },
        {
          name: 'domain',
          label: t('Domain'),
          type: 'input',
          required: false,
          tip: t('Optional. Domain context for the secret'),
        },
      ];
    }

    if (isOrder) {
      return [
        ...baseItems,
        {
          name: 'secret_type',
          label: t('Secret Type'),
          type: 'select',
          options: this.secretTypeOptions,
          required: true,
          onChange: this.onSecretTypeChange,
        },
        {
          name: 'algorithm',
          label: t('Algorithm'),
          type: 'select',
          options: this.algorithmOptions,
          required: true,
        },
        {
          name: 'bit_length',
          label: t('Bit Length'),
          type: 'select',
          options: this.bitLengthOptions,
          required: true,
          display: secret_type === 'symmetric' || secret_type === 'asymmetric',
        },
        {
          name: 'expiration',
          label: t('Expiration Date'),
          type: 'date-picker',
          showToday: false,
          disabledDate: (current) => current && current <= moment().endOf('d'),
          tip: t('Optional. When the secret should expire'),
        },
        {
          name: 'domain',
          label: t('Domain'),
          type: 'input',
          required: false,
          tip: t('Optional. Domain context for the secret'),
        },
      ];
    }

    return baseItems;
  }

  onClickCancel = () => {
    // Only close the modal, do not navigate
    this.onCancel();
  };

  onSubmit = (values) => {
    const { creationType, ...rest } = values;

    if (creationType === 'direct') {
      return this.secretsStore.create(rest);
    }

    if (creationType === 'order') {
      return this.ordersStore.create(rest);
    }

    return Promise.reject(new Error('Invalid creation type'));
  };
}

export default inject('rootStore')(observer(CreateSecret));
