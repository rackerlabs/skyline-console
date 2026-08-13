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

import Base from 'components/Form';
import { inject, observer } from 'mobx-react';
import { NetworkStore } from 'src/stores/neutron/network';
import { networkColumns } from 'resources/neutron/network';

export class StepNetwork extends Base {
  async init() {
    this.externalNetworkStore = new NetworkStore();
  }

  get title() {
    return t('Network');
  }

  get name() {
    return t('Network');
  }

  get isStep() {
    return true;
  }

  get isEdit() {
    return !!this.props.extra;
  }

  get networkDrivers() {
    const { context = {} } = this.props;
    const coe = context.coe || 'kubernetes';
    let acceptedDrivers = [];
    if (coe === 'kubernetes') {
      acceptedDrivers = [{ value: 'calico', label: 'Calico' }];
    } else if (['swarm', 'swarm-mode'].includes(coe)) {
      acceptedDrivers = [
        { value: 'docker', label: 'Docker' },
        { value: 'flannel', label: 'Flannel' },
      ];
    } else if (['mesos', 'dcos'].includes(coe)) {
      acceptedDrivers = [{ value: 'docker', label: 'Docker' }];
    }
    return acceptedDrivers;
  }

  get defaultValue() {
    const { context: { externalNetwork: externalNetworkContext } = {} } =
      this.props;
    let values = {
      network_driver: 'calico',
      master_lb_enabled: true,
      // Enable Floating IP by default on cluster template creation. Users may
      // still uncheck it if required.
      floating_ip_enabled: true,
    };

    if (this.isEdit) {
      const {
        extra: {
          network_driver,
          http_proxy,
          https_proxy,
          no_proxy,
          external_network_id,
          externalNetwork,
          dns_nameserver,
          master_lb_enabled,
          floating_ip_enabled,
        } = {},
      } = this.props;
      values = {
        network_driver,
        http_proxy,
        https_proxy,
        no_proxy,
        dns_nameserver,
        master_lb_enabled,
        floating_ip_enabled,
      };
      if (external_network_id) {
        values.externalNetwork = {
          selectedRowKeys: [external_network_id],
          selectedRows: [externalNetwork],
        };
      }
      if (externalNetworkContext) {
        values.externalNetwork = externalNetworkContext;
      }
    }

    if (!this.isEdit && externalNetworkContext) {
      values.externalNetwork = externalNetworkContext;
    }

    return values;
  }

  get formItems() {
    return [
      {
        name: 'networkDriverDisplay',
        label: t('Network Driver'),
        type: 'label',
        content: t('Calico'),
        style: { marginBottom: 24 },
      },
      {
        name: 'network_driver',
        type: 'input',
        hidden: true,
      },
      {
        name: 'http_proxy',
        label: t('HTTP Proxy'),
        placeholder: t('The http_proxy address to use for nodes in cluster'),
        type: 'input',
      },
      {
        name: 'https_proxy',
        label: t('HTTPS Proxy'),
        placeholder: t('The https_proxy address to use for nodes in cluster'),
        type: 'input',
      },
      {
        name: 'no_proxy',
        label: t('No Proxy'),
        placeholder: t('The no_proxy address to use for nodes in cluster'),
        type: 'input',
      },
      {
        name: 'externalNetwork',
        label: t('External Network'),
        type: 'select-table',
        backendPageStore: this.externalNetworkStore,
        extraParams: {
          'router:external': true,
        },
        required: true,
        loading: this.externalNetworkStore.list.isLoading,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: networkColumns(this),
        onChange: (value) => {
          this.updateContext({
            externalNetwork: value,
          });
        },
      },
      {
        name: 'dns_nameserver',
        label: t('DNS'),
        placeholder: t('The DNS nameserver to use for this cluster template'),
        type: 'input',
      },
      {
        name: 'master_lb_enabled',
        label: t('Enable Load Balancer'),
        type: 'check',
        content: t('Enabled Load Balancer for Master Nodes'),
        disabled: true,
      },
      {
        name: 'floating_ip_enabled',
        label: t('Enable Floating IP'),
        type: 'check',
        tip: t(
          'Whether enable or not using the floating IP of cloud provider.'
        ),
      },
    ];
  }
}

export default inject('rootStore')(observer(StepNetwork));
