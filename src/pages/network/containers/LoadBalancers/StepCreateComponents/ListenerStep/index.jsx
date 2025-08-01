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
import Base from 'components/Form';
import {
  getCertificateColumns,
  getListenerInsertHeadersFormItem,
  listenerProtocols,
  sslParseMethod,
} from 'resources/octavia/lb';
import { ContainersStore } from 'stores/barbican/containers';
import { SecretsStore } from 'stores/barbican/secrets';

export class ListenerStep extends Base {
  init() {
    this.containersStore = new ContainersStore();
    this.secretsStore = new SecretsStore();
    this.fetchContainers();
    this.fetchSecrets();
    this.state = {
      ...this.state,
      l7policies: [],
    };
  }

  get title() {
    return 'Listener Detail';
  }

  get name() {
    return 'Listener Detail';
  }

  get isStep() {
    return true;
  }

  fetchContainers() {
    this.containersStore.fetchList();
  }

  fetchSecrets() {
    this.secretsStore.fetchList({ mode: 'CA' });
  }

  get SERVERSecrets() {
    return this.containersStore.list.data || [];
  }

  get CASecrets() {
    return this.secretsStore.list.data || [];
  }

  get SNISecrets() {
    return (this.containersStore.list.data || []).filter((it) => !!it.domain);
  }

  get defaultValue() {
    return {
      listener_ssl_parsing_method: 'one-way',
      listener_sni_enabled: false,
      listener_connection_limit: -1,
      listener_admin_state_up: true,
      l7_policies: [],
    };
  }

  get nameForStateUpdate() {
    return [
      'listener_protocol',
      'listener_ssl_parsing_method',
      'listener_sni_enabled',
      'l7policies',
    ];
  }

  allowed = () => Promise.resolve();

  get formItems() {
    const {
      listener_protocol,
      listener_ssl_parsing_method,
      listener_sni_enabled,
    } = this.state;

    const insertHeadersFormItem = getListenerInsertHeadersFormItem();
    return [
      {
        name: 'listener_name',
        label: t('Listener Name'),
        type: 'input-name',
        required: true,
      },
      {
        name: 'listener_description',
        label: t('Listener Description'),
        type: 'textarea',
      },
      {
        name: 'listener_protocol',
        label: t('Listener Protocol'),
        type: 'select',
        options: listenerProtocols,
        onChange: () => {
          this.updateContext({
            pool_protocol: '',
            health_type: '',
          });
        },
        required: true,
      },
      {
        name: 'listener_ssl_parsing_method',
        label: t('SSL Parsing Method'),
        type: 'select',
        options: sslParseMethod,
        required: true,
        display: listener_protocol === 'TERMINATED_HTTPS',
      },
      {
        name: 'listener_default_tls_container_ref',
        label: t('Server Certificate'),
        type: 'select-table',
        required: true,
        data: this.SERVERSecrets.filter((cert) => {
          if (!cert.expiration) return true;
          const expirationDate = new Date(cert.expiration);
          const now = new Date();
          return expirationDate.getTime() > now.getTime();
        }),
        isLoading: false,
        isMulti: false,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: getCertificateColumns(this),
        display: listener_protocol === 'TERMINATED_HTTPS',
      },
      {
        name: 'listener_client_ca_tls_container_ref',
        label: t('CA Certificate'),
        type: 'select-table',
        required: true,
        data: this.CASecrets.filter((cert) => {
          if (!cert.expiration) return true;
          const expirationDate = new Date(cert.expiration);
          const now = new Date();
          return expirationDate.getTime() > now.getTime();
        }),
        isLoading: false,
        isMulti: false,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: getCertificateColumns(this).filter(
          (it) => it.dataIndex !== 'domain'
        ),
        display:
          listener_protocol === 'TERMINATED_HTTPS' &&
          listener_ssl_parsing_method === 'two-way',
      },
      {
        name: 'listener_sni_enabled',
        label: t('SNI Enabled'),
        type: 'switch',
        display: listener_protocol === 'TERMINATED_HTTPS',
      },
      {
        name: 'listener_sni_container_refs',
        label: t('SNI Certificate'),
        type: 'select-table',
        required: true,
        data: this.SNISecrets,
        isLoading: false,
        isMulti: true,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: getCertificateColumns(this),
        display:
          listener_protocol === 'TERMINATED_HTTPS' && listener_sni_enabled,
      },
      {
        name: 'listener_protocol_port',
        label: t('Listener Protocol Port'),
        type: 'input-number',
        required: true,
      },
      {
        name: 'listener_connection_limit',
        label: t('Listener Connection Limit'),
        type: 'input-number',
        min: -1,
        extra: t('-1 means no connection limit'),
        required: true,
      },
      {
        name: 'listener_admin_state_up',
        label: t('Admin State Up'),
        type: 'switch',
        tip: t('Defines the admin state of the listener.'),
      },
      {
        name: 'l7policies',
        label: t('Layer 7 Policies'),
        type: 'l7policy-allocator',
        required: false,
      },
      insertHeadersFormItem,
    ];
  }
}

export default inject('rootStore')(observer(ListenerStep));
