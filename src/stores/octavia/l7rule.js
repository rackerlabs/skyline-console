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
import Base from 'stores/base';

export class L7RuleStore extends Base {
  get client() {
    return client.octavia.l7policies.rules;
  }

  get isSubResource() {
    return true;
  }

  get listFilterByProject() {
    return true;
  }

  getFatherResourceId = ({ l7policy_id } = {}) => {
    if (!l7policy_id) {
      throw new Error('An L7 policy ID is required for rule operations.');
    }
    return l7policy_id;
  };

  listFetchByClient(params, originParams = {}) {
    const { l7policy_id, ...query } = params;
    const policyId = this.getFatherResourceId({
      l7policy_id: originParams.l7policy_id || l7policy_id,
    });
    // The parent belongs in the URL, never in the query string.
    return this.client.list(policyId, query);
  }

  get mapper() {
    return (data, allProjects, params = {}) => ({
      ...data,
      // Rule responses do not include their parent; retain it for row actions.
      l7policy_id: params.l7policy_id || data.l7policy_id,
    });
  }

  async pureFetchDetail(params) {
    const result = await this.detailFetchByClient(params);
    return this.mapper(result[this.responseKey], undefined, params);
  }

  // Accept API field names, with l7policy_id used only as URL context.
  @action
  create({ l7policy_id, ...data }) {
    const policyId = this.getFatherResourceId({ l7policy_id });
    return this.submitting(
      this.client.create(policyId, { [this.responseKey]: data })
    );
  }

  @action
  update(params, data) {
    const policyId = this.getFatherResourceId(params);
    return this.submitting(
      this.client.update(policyId, params.id, { [this.responseKey]: data })
    );
  }

  @action
  edit(params, data) {
    return this.update(params, data);
  }

  @action
  delete = (params) => {
    const policyId = this.getFatherResourceId(params);
    return this.submitting(this.client.delete(policyId, params.id));
  };
}

const globalL7RuleStore = new L7RuleStore();
export default globalL7RuleStore;
