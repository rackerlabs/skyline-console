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

export class FreezerActionStore extends Base {
  get client() {
    return client.freezer.actions;
  }

  get listResponseKey() {
    return 'actions';
  }

  // freezer-api returns only 10 items by default; request all explicitly.
  listFetchByClient(params, originParams) {
    return super.listFetchByClient({ limit: 500, ...params }, originParams);
  }

  get mapper() {
    return (data) => ({
      ...data,
      id: data.action_id,
      name: data.freezer_action?.backup_name || data.action_id,
      action_type: data.freezer_action?.action || '',
      path_to_backup:
        data.freezer_action?.path_to_backup ||
        data.freezer_action?.restore_abs_path ||
        '',
      storage: data.freezer_action?.storage || '',
      mode: data.freezer_action?.mode || '',
      container: data.freezer_action?.container || '',
      backup_name: data.freezer_action?.backup_name || '',
      max_retries: data.max_retries,
      max_retries_interval: data.max_retries_interval,
      mandatory: data.mandatory,
    });
  }

  // freezer-api expects the raw body (no {action: ...} wrapper)
  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }
}

const globalFreezerActionStore = new FreezerActionStore();
export default globalFreezerActionStore;
