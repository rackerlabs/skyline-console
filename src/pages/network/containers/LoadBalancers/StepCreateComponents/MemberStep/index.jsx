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
import { PortStore } from 'stores/neutron/port-extension';
import { get } from 'lodash';
import instanceNameStore from 'stores/nova/instance-name';

export class MemberStep extends Base {
  init() {
    this.store = new PortStore();
    this.state = {
      ports: [],
    };
    this.store.fetchList().then((ports) => {
      const filteredPorts = ports.filter(
        (port) =>
          port.device_owner !== 'network:dhcp' &&
          port.device_owner !== 'network:router_gateway'
      );

      // Immediately populate table with ports, using server_name for compute:nova
      // This allows the table to show data right away
      const initialPorts = filteredPorts.map((port) => {
        // Use server_name for compute:nova (already available from backend)
        const instanceName =
          port.device_owner === 'compute:nova' ? port.server_name || '' : '';
        return {
          ...port,
          instance_name: instanceName,
        };
      });
      this.setState({ ports: initialPorts });

      // Then fetch instance names in the background for ports that need it
      // Only fetch for ports that don't already have server_name
      const portsNeedingFetch = filteredPorts.filter(
        (port) =>
          port.id &&
          port.device_owner !== 'compute:nova' &&
          port.device_owner &&
          port.device_owner.startsWith('compute:')
      );

      if (portsNeedingFetch.length === 0) {
        return;
      }

      // Fetch instance names in parallel and update state as they come in
      Promise.all(
        portsNeedingFetch.map(async (port) => {
          try {
            const instanceName =
              await instanceNameStore.fetchInstanceNameByPortId(port.id);
            return { portId: port.id, instanceName };
          } catch (error) {
            return { portId: port.id, instanceName: '' };
          }
        })
      ).then((results) => {
        // Update ports with fetched instance names
        const instanceNameMap = new Map(
          results.map((result) => [result.portId, result.instanceName])
        );

        const updatedPorts = this.state.ports.map((port) => {
          if (instanceNameMap.has(port.id)) {
            return {
              ...port,
              instance_name: instanceNameMap.get(port.id),
            };
          }
          return port;
        });

        this.setState({ ports: updatedPorts });
      });
    });
  }

  get title() {
    return 'Member Detail';
  }

  get name() {
    return 'Member Detail';
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  get wrapperCol() {
    return {
      xs: { span: 16 },
      sm: { span: 12 },
    };
  }

  get formItems() {
    const subnet_id = get(this.props.context, 'vip_address[0].subnet', '');
    return [
      {
        name: 'extMembers',
        type: 'member-allocator',
        lbSubnetId: subnet_id,
        isLoading: this.store.list.isLoading,
        ports: this.state.ports,
      },
    ];
  }
}

export default inject('rootStore')(observer(MemberStep));
