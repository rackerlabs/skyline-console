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
    return ['creationType', 'secret_type', 'request_type', 'algorithm'];
  }

  onSecretTypeChange = (value) => {
    const { creationType } = this.state;

    // For direct creation, don't auto-set algorithm since it's more flexible
    if (creationType === 'direct') {
      if (this.formRef.current) {
        this.formRef.current.setFieldsValue({
          secret_type: value,
        });
      }
      return;
    }

    // For order creation, update bit length and algorithm when request type changes
    let newBitLength;
    let newAlgorithm;

    if (value === 'key') {
      newBitLength = 256;
      newAlgorithm = 'aes'; // Default key algorithm
    } else if (value === 'asymmetric') {
      newBitLength = 2048;
      newAlgorithm = 'rsa'; // Default asymmetric algorithm
    } else {
      // For certificate and stored-key, clear bit_length and algorithm
      newBitLength = undefined;
      newAlgorithm = undefined;
    }

    // Update the form field value using the form's setFieldsValue method
    if (this.formRef.current) {
      this.formRef.current.setFieldsValue({
        request_type: value,
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
      payload_content_encoding: '',
      algorithm: 'aes', // Default as per CLI
      bit_length: 256, // Default as per CLI
      mode: 'cbc', // Default as per CLI
      secret_type: 'opaque', // Default as per CLI for direct creation
      request_type: 'key', // Default as per CLI for orders
      expiration: '',
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

  get requestTypeOptions() {
    return [
      {
        label: t('Key'),
        value: 'key',
        tip: t('Symmetric keys, private keys, and passphrases'),
      },
      {
        label: t('Asymmetric Key'),
        value: 'asymmetric',
        tip: t('Asymmetric key pairs (public/private)'),
      },
    ];
  }

  get secretTypeOptionsForDirect() {
    return [
      {
        label: t('Opaque'),
        value: 'opaque',
        tip: t('Default secret type for arbitrary data'),
      },
      {
        label: t('Symmetric'),
        value: 'symmetric',
        tip: t('Symmetric keys'),
      },
      {
        label: t('Public'),
        value: 'public',
        tip: t('Public keys'),
      },
      {
        label: t('Private'),
        value: 'private',
        tip: t('Private keys'),
      },
      {
        label: t('Certificate'),
        value: 'certificate',
        tip: t('Certificates'),
      },
      {
        label: t('Passphrase'),
        value: 'passphrase',
        tip: t('Passphrases'),
      },
    ];
  }

  get algorithmOptions() {
    const { secret_type, request_type } = this.state;
    const currentType = secret_type || request_type;

    if (currentType === 'key') {
      return [
        {
          label: 'AES (default)',
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
        {
          label: 'RSA',
          value: 'rsa',
        },
        {
          label: 'DSA',
          value: 'dsa',
        },
        {
          label: 'EC',
          value: 'ec',
        },
      ];
    }

    if (currentType === 'asymmetric') {
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

    // Default options for direct creation and other request types
    return [
      {
        label: 'AES (default)',
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
      {
        label: 'RSA',
        value: 'rsa',
      },
      {
        label: 'DSA',
        value: 'dsa',
      },
      {
        label: 'EC',
        value: 'ec',
      },
    ];
  }

  get bitLengthOptions() {
    return [
      { label: '128', value: 128 },
      { label: '192', value: 192 },
      { label: '256 (default)', value: 256 },
      { label: '1024', value: 1024 },
      { label: '2048', value: 2048 },
      { label: '4096', value: 4096 },
    ];
  }

  get modeOptions() {
    return [
      { label: 'CBC (default)', value: 'cbc' },
      { label: 'CTR', value: 'ctr' },
    ];
  }

  get formItems() {
    const { creationType } = this.state;
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
        required: false, // Always optional to ensure it's included in form values
        withoutChinese: true,
        tip: isOrder
          ? t('Optional. If not provided, a name will be auto-generated')
          : t('Required for direct creation'),
        rules: isDirect
          ? [
              {
                required: true,
                message: t('Secret name is required for direct creation'),
              },
            ]
          : [],
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
          label: t('Payload Content Type'),
          type: 'select',
          options: [
            { label: 'text/plain (default)', value: 'text/plain' },
            {
              label: 'application/octet-stream',
              value: 'application/octet-stream',
            },
            { label: 'application/x-pkcs12', value: 'application/x-pkcs12' },
            {
              label: 'application/x-pem-file',
              value: 'application/x-pem-file',
            },
          ],
          required: true,
          tip: t('Required when payload is supplied'),
        },
        {
          name: 'payload_content_encoding',
          label: t('Payload Content Encoding'),
          type: 'input',
          required: false,
          tip: t(
            'Required if payload content type is "application/octet-stream"'
          ),
        },
        {
          name: 'secret_type',
          label: t('Secret Type'),
          type: 'select',
          options: [
            {
              label: t('Select Secret Type'),
              value: '',
            },
            ...this.secretTypeOptionsForDirect,
          ],
          required: false,
          tip: t('Optional. Type of secret being stored (default: opaque)'),
        },
        {
          name: 'algorithm',
          label: t('Algorithm'),
          type: 'select',
          options: [
            {
              label: t('Select Algorithm'),
              value: '',
            },
            ...this.algorithmOptions,
          ],
          required: false,
          tip: t('Optional. Algorithm used by the secret (default: aes)'),
        },
        {
          name: 'bit_length',
          label: t('Bit Length'),
          type: 'select',
          options: [
            {
              label: t('Select Bit Length'),
              value: '',
            },
            ...this.bitLengthOptions,
          ],
          required: false,
          tip: t('Optional. Bit length of the secret (default: 256)'),
        },
        {
          name: 'mode',
          label: t('Mode'),
          type: 'select',
          options: [
            {
              label: t('Select Mode'),
              value: '',
            },
            ...this.modeOptions,
          ],
          required: false,
          tip: t(
            'Optional. Algorithm mode, used only for reference (default: cbc)'
          ),
        },
        {
          name: 'expiration',
          label: t('Expiration Date'),
          type: 'date-picker',
          showToday: false,
          disabledDate: (current) => current && current <= moment().endOf('d'),
          tip: t('Optional. When the secret should expire (ISO 8601 format)'),
        },
      ];
    }

    if (isOrder) {
      return [
        ...baseItems,
        {
          name: 'request_type',
          label: t('Request Type'),
          type: 'select',
          options: this.requestTypeOptions,
          required: true,
          onChange: this.onSecretTypeChange,
        },
        {
          name: 'algorithm',
          label: t('Algorithm'),
          type: 'select',
          options: this.algorithmOptions,
          required: false,
          tip: t(
            'Optional. Algorithm to be used with the requested key (default: aes)'
          ),
        },
        {
          name: 'bit_length',
          label: t('Bit Length'),
          type: 'select',
          options: this.bitLengthOptions,
          required: false,
          tip: t(
            'Optional. Bit length of the requested secret key (default: 256)'
          ),
        },
        {
          name: 'mode',
          label: t('Mode'),
          type: 'select',
          options: this.modeOptions,
          required: false,
          tip: t(
            'Optional. Algorithm mode to be used with the requested key (default: cbc)'
          ),
        },
        {
          name: 'payload_content_type',
          label: t('Payload Content Type'),
          type: 'select',
          options: [
            {
              label: 'application/octet-stream (default)',
              value: 'application/octet-stream',
            },
            { label: 'text/plain', value: 'text/plain' },
            { label: 'application/x-pkcs12', value: 'application/x-pkcs12' },
            {
              label: 'application/x-pem-file',
              value: 'application/x-pem-file',
            },
          ],
          required: false,
          tip: t(
            'Optional. Type/format of the secret to be generated (default: application/octet-stream)'
          ),
        },
        {
          name: 'expiration',
          label: t('Expiration Date'),
          type: 'date-picker',
          showToday: false,
          disabledDate: (current) => current && current <= moment().endOf('d'),
          tip: t('Optional. Expiration time for the secret in ISO 8601 format'),
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
      // Validate that name is provided for direct creation
      if (!rest.name || rest.name.trim() === '') {
        return Promise.reject(
          new Error(t('Secret name is required for direct creation'))
        );
      }
      return this.secretsStore.create(rest);
    }

    if (creationType === 'order') {
      return this.ordersStore.create(rest);
    }

    return Promise.reject(new Error('Invalid creation type'));
  };
}

export default inject('rootStore')(observer(CreateSecret));
