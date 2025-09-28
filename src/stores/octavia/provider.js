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

import client from 'client';
import Base from 'stores/base';

export class LoadBalancerProviderStore extends Base {
  get client() {
    return client.octavia.providers;
  }

  get listWithDetail() {
    return false;
  }

  /**
   * Fetches the list of available load balancer providers from the Octavia API.
   *
   * If the API call fails (e.g., endpoint doesn't exist, network error, etc.),
   * it falls back to a static list of commonly available providers.
   *
   * @param {Object} params - Optional parameters for the API call
   * @returns {Array} Array of provider objects with label and value properties
   */
  async fetchList(params) {
    try {
      const result = await this.client.list(params);
      const providers = result?.providers || [];

      // Transform providers to the format expected by the form
      return providers.map((provider) => ({
        label: provider.name,
        value: provider.name,
        ...provider,
      }));
    } catch (error) {
      console.warn(
        'Failed to fetch providers from API, falling back to static data:',
        error
      );
      // Fallback to static data if API call fails
      // This ensures the form always has options available even if the API endpoint
      // doesn't exist or there's a network issue
      return [
        { label: 'amphora', value: 'amphora' },
        { label: 'ovn', value: 'ovn' },
      ];
    }
  }
}

const globalLoadBalancerProviderStore = new LoadBalancerProviderStore();
export default globalLoadBalancerProviderStore;
