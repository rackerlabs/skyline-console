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

export class L7PolicyStore extends Base {
  get client() {
    return client.octavia.l7policies;
  }

  get listResponseKey() {
    return 'l7policies';
  }

  get listFilterByProject() {
    return true;
  }

  get paramsFunc() {
    const baseParams = super.paramsFunc;
    return (params) => ({
      ...baseParams(params),
      // BaseStore's query allowlist does not include listener_id.
      ...(params.listener_id ? { listener_id: params.listener_id } : {}),
    });
  }
}

const globalL7PolicyStore = new L7PolicyStore();
export default globalL7PolicyStore;
