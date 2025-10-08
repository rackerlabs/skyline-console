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

import { action, observable } from 'mobx';
import client from 'client';

class InstanceNameStore {
  @observable
  instanceDetails = new Map();

  @action
  async fetchInstanceNameByPortId(portId) {
    if (!portId || typeof portId !== 'string' || portId.trim() === '') {
      return '';
    }

    if (this.instanceDetails.has(portId)) {
      return this.instanceDetails.get(portId);
    }

    let deviceId = '';
    let instanceName = '';

    try {
      const portDetail = await client.neutron.ports.show(portId);
      if (portDetail && typeof portDetail === 'object') {
        deviceId =
          (portDetail.port && portDetail.port.device_id) ||
          portDetail.device_id ||
          '';
        const isComputeInstance =
          portDetail.port?.device_owner?.startsWith('compute:') || false;
        if (!deviceId || !isComputeInstance) {
          return '';
        }
      }
      if (!deviceId) {
        return '';
      }
    } catch (portError) {
      return '';
    }

    if (deviceId) {
      try {
        const server = await client.nova.servers.show(deviceId);
        if (
          server &&
          typeof server === 'object' &&
          server.server &&
          typeof server.server === 'object' &&
          'name' in server.server
        ) {
          instanceName = server.server.name || '';
        }
      } catch (serverError) {
        try {
          const serverList = await client.nova.servers.list();
          const matchingServer = serverList.servers.find(
            (s) => s.id === deviceId
          );
          if (matchingServer) {
            instanceName = matchingServer.name || '';
          }
        } catch (listError) {}
      }
    }

    this.instanceDetails.set(portId, instanceName);
    return instanceName;
  }
}

export default new InstanceNameStore();
