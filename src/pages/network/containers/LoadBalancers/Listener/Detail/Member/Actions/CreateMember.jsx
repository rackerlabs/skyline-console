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
import { ModalAction } from 'containers/Action';
import { PoolMemberStore } from 'stores/octavia/pool-member';
import { PortStore } from 'stores/neutron/port-extension';
import { toJS } from 'mobx';
import { uniqWith, get } from 'lodash';
import globalLbaasStore from 'stores/octavia/loadbalancer';
import isEqual from 'react-fast-compare';
import instanceNameStore from 'stores/nova/instance-name';

export class CreateAction extends ModalAction {
  static id = 'manage-member';

  static title = t('Add Member');

  get name() {
    return t('Add Member');
  }

  static policy = 'os_load-balancer_api:member:post';

  static allowed = (item) =>
    Promise.resolve(
      item.provisioning_status === 'ACTIVE' && !!item.default_pool_id
    );

  init() {
    this.store = new PortStore();
    this.memberStore = new PoolMemberStore();
    this.lbDetail = {};
    this.state = {
      ports: [],
    };
  }

  componentDidMount() {
    this.getMember();
    globalLbaasStore
      .fetchDetail({
        id: this.props.containerProps.match.params.loadBalancerId,
      })
      .then((lb) => {
        this.lbDetail = lb;
        return this.store.fetchList();
      })
      .then((ports) => {
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

  static get modalSize() {
    return 'large';
  }

  async getMember() {
    const { default_pool_id } = this.item;
    await this.memberStore.fetchList({ pool_id: default_pool_id });
  }

  getModalSize() {
    return 'large';
  }

  get item() {
    const { item } = this.props;
    if (!item) {
      return this.containerProps.detail;
    }
    return item;
  }

  get defaultValue() {
    return {};
  }

  get tips() {
    return (
      <div style={{ display: 'inline-table' }}>
        <p style={{ color: globalCSS.primaryColor }}>
          {t(
            'The amphora instance is required for load balancing service setup and is not recommended'
          )}
        </p>
      </div>
    );
  }

  get formItems() {
    return [
      {
        name: 'extMembers',
        type: 'member-allocator',
        lbSubnetId: get(this.lbDetail, 'vip_subnet_id', ''),
        isLoading: this.store.list.isLoading,
        ports: this.state.ports,
        members: this.memberStore.list.data,
      },
    ];
  }

  onSubmit = (values) => {
    const { default_pool_id } = this.item;
    const { extMembers = [] } = values;
    const members = toJS(this.memberStore.list.data).map((it) => {
      const { weight, protocol_port, address, name, subnet_id } = it;
      return { weight, protocol_port, address, name, subnet_id };
    });
    extMembers.forEach((member) => {
      const {
        ip,
        protocol_port,
        weight,
        name = null,
        subnet_id,
      } = member.ip_address;
      const addMember = {
        weight,
        protocol_port,
        address: ip,
        name,
        subnet_id,
      };
      members.push(addMember);
    });
    return this.memberStore.batchUpdate({
      default_pool_id,
      data: uniqWith(members, isEqual),
    });
  };
}

export default inject('rootStore')(observer(CreateAction));
