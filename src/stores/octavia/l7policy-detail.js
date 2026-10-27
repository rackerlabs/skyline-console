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

import { action } from 'mobx';
import client from 'client';
import { L7PolicyStore } from './l7policy';

// Fetch the parents with each detail refresh so rule actions use current statuses.
export class L7PolicyDetailStore extends L7PolicyStore {
  @action
  async fetchDetail(params) {
    try {
      return await super.fetchDetail(params);
    } catch (error) {
      this.detail = {};
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async detailFetchByClient({ id, listenerId, loadBalancerId }, params) {
    const { l7policy } = await this.client.show(id, params);
    if (!listenerId || !loadBalancerId || l7policy.listener_id !== listenerId) {
      throw Object.assign(
        new Error(t('The L7 policy does not belong to this listener.')),
        { status: 404 }
      );
    }
    const { listener } = await client.octavia.listeners.show(listenerId);
    if (
      !(listener.loadbalancers || []).some((lb) => lb.id === loadBalancerId)
    ) {
      throw Object.assign(
        new Error(t('The listener does not belong to this load balancer.')),
        { status: 404 }
      );
    }
    const { loadbalancer } = await client.octavia.loadbalancers.show(
      loadBalancerId
    );
    return {
      l7policy: {
        ...l7policy,
        listener: { ...listener, loadBalancer: loadbalancer },
      },
    };
  }
}
