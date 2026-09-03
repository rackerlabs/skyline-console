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

import Base from '../client/base';
import { freezerBase, freezerEndpoint } from '../client/constants';

export class FreezerClient extends Base {
  get baseUrl() {
    return freezerBase();
  }

  get enable() {
    return !!freezerEndpoint();
  }

  get projectInUrl() {
    return true;
  }

  get resources() {
    return [
      {
        key: 'jobs',
        responseKey: 'job',
        extendOperations: [
          {
            name: 'start',
            generate: (id) =>
              this.request.post(
                this.getSubResourceUrlById('jobs', 'event', id),
                { start: null }
              ),
          },
          {
            name: 'stop',
            generate: (id) =>
              this.request.post(
                this.getSubResourceUrlById('jobs', 'event', id),
                { stop: null }
              ),
          },
        ],
      },
      {
        key: 'actions',
        responseKey: 'action',
      },
      {
        key: 'clients',
        responseKey: 'client',
      },
      {
        key: 'backups',
        responseKey: 'backup',
        extendOperations: [
          {
            key: 'restore',
            method: 'post',
            isDetail: true,
          },
        ],
      },
    ];
  }
}

const freezerClient = new FreezerClient();
export default freezerClient;
