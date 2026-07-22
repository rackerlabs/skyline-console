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

import { getGiBValue } from 'utils/index';
import { action, observable } from 'mobx';
import { get } from 'lodash';
import client from 'client';
import Base from 'stores/base';

export class HypervisorStore extends Base {
  @observable
  overview = {};

  get client() {
    return client.nova.hypervisors;
  }

  get providerClient() {
    return client.placement.resourceProviders;
  }

  get listWithDetail() {
    return true;
  }

  get mapper() {
    return (data) => {
      return {
        ...data,
        service_host: data?.service?.host || '',
      };
    };
  }

  fetchInventories = (id) =>
    this.providerClient.inventories.list(id).catch(() => null);

  applyInventoryRatios = (item, inventoryResult) => {
    if (item.hypervisor_type === 'ironic' || !inventoryResult) {
      return item;
    }
    const { VCPU, MEMORY_MB } = inventoryResult.inventories || {};
    if (VCPU?.allocation_ratio != null) {
      item.vcpus *= VCPU.allocation_ratio;
    }
    if (MEMORY_MB?.allocation_ratio != null) {
      item.memory_mb *= MEMORY_MB.allocation_ratio;
    }
    return item;
  };

  applyUsageStats = (item) => {
    item.vcpus_used_percent =
      (item.vcpus && ((item.vcpus_used / item.vcpus) * 100).toFixed(2)) || 0;
    item.memory_mb_percent =
      (item.memory_mb &&
        ((item.memory_mb_used / item.memory_mb) * 100).toFixed(2)) ||
      0;
    item.storage_percent =
      (item.local_gb &&
        ((item.local_gb_used / item.local_gb) * 100).toFixed(2)) ||
      0;
    item.memory_mb_used_gb = getGiBValue(item.memory_mb_used);
    item.memory_mb_gb = getGiBValue(item.memory_mb);
    return item;
  };

  async listDidFetch(items, all_projects, filters) {
    const { simple } = filters;
    if (simple) {
      return items;
    }
    const inventories = await Promise.all(
      items.map((it) => this.fetchInventories(it.id))
    );
    return items.map((item, index) => {
      this.applyInventoryRatios(item, inventories[index]);
      return this.applyUsageStats(item);
    });
  }

  @action
  async fetchDetail({ id, all_projects }) {
    this.isLoading = true;
    const result = await this.client.show(id);
    const originData = get(result, this.responseKey) || result;
    const item = this.mapperBeforeFetchProject(originData);
    const { resource_providers } = await this.providerClient.list({
      in_tree: id,
    });
    const provider = (resource_providers || []).filter((it) => it.uuid !== id);
    const promiseArr = [this.fetchInventories(id)];
    if (provider.length) {
      // If there is a provider, the VGPU is available
      promiseArr.push(
        this.fetchInventories(provider[0].uuid),
        this.providerClient.usages.list(provider[0].uuid).catch(() => null)
      );
    }
    const [inventoriesBase, inventoriesVGPU, usagesVGPU] = await Promise.all(
      promiseArr
    );
    this.applyInventoryRatios(item, inventoriesBase);
    if (inventoriesVGPU && usagesVGPU) {
      const { inventories: { VGPU: { allocation_ratio, total } } = {} } =
        inventoriesVGPU;
      if (allocation_ratio != null && total != null) {
        item.vgpus = allocation_ratio * total;
      }
      const { usages: { VGPU } = {} } = usagesVGPU;
      item.vgpus_used = VGPU;
    }
    item.memory_mb_used_gb = getGiBValue(item.memory_mb_used);
    item.memory_mb_gb = getGiBValue(item.memory_mb);
    const newItem = await this.detailDidFetch(item, all_projects);
    const detail = this.mapper(newItem);
    this.detail = detail;
    this.isLoading = false;
    return detail;
  }

  @action
  getVirtualResource = async () => {
    this.isLoading = true;
    const hypervisorResult = await this.client.listDetail();
    const { hypervisors } = hypervisorResult;
    const data = {
      vcpus: 0,
      vcpus_used: 0,
      memory_mb: 0,
      memory_mb_used: 0,
      local_gb: 0,
      local_gb_used: 0,
    };
    const inventories = await Promise.all(
      hypervisors.map((it) => this.fetchInventories(it.id))
    );
    hypervisors.forEach((item, index) => {
      this.applyInventoryRatios(item, inventories[index]);
      data.vcpus += item.vcpus;
      data.vcpus_used += item.vcpus_used;
      data.memory_mb += getGiBValue(item.memory_mb);
      data.memory_mb_used += getGiBValue(item.memory_mb_used);
      // fetch storage info from prometheus
      // data.local_gb += item.local_gb;
      // data.local_gb_used += item.local_gb_used;
      // fetch storage info from prometheus
    });

    this.overview = data;
    this.isLoading = false;
  };
}

const globalHypervisorStore = new HypervisorStore();
export default globalHypervisorStore;
