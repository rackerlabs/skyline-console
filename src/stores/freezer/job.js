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

export class FreezerJobStore extends Base {
  get client() {
    return client.freezer.jobs;
  }

  get listResponseKey() {
    return 'jobs';
  }

  // freezer-api returns only 10 items by default; request all explicitly.
  listFetchByClient(params, originParams) {
    return super.listFetchByClient({ limit: 500, ...params }, originParams);
  }

  get mapper() {
    return (data) => ({
      ...data,
      id: data.job_id,
      name: data.description || data.job_id,
      status: data.job_schedule?.status || '',
      result: data.job_schedule?.result || '',
      actions_count: data.job_actions ? data.job_actions.length : 0,
    });
  }

  @action
  start(id) {
    return this.submitting(this.client.start(id));
  }

  @action
  stop(id) {
    return this.submitting(this.client.stop(id));
  }

  // freezer-api expects the raw body (no {job: ...} wrapper)
  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }
}

const globalFreezerJobStore = new FreezerJobStore();
export default globalFreezerJobStore;
