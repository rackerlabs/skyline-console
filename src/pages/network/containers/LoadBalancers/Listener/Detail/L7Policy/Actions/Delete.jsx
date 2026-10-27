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

import { ConfirmAction } from 'containers/Action';
import globalL7PolicyStore from 'stores/octavia/l7policy';
import { canChangePolicy } from '../helpers';

export default class Delete extends ConfirmAction {
  get id() {
    return 'l7policy-delete';
  }

  get title() {
    return t('Delete L7 Policy');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete L7 Policy');
  }

  get isDanger() {
    return true;
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_load-balancer_api:l7policy:delete';

  allowedCheckFunc = (item) =>
    canChangePolicy(item, this.containerProps?.detail, true);

  confirmContext = (data) =>
    t('Delete L7 policy {name} and all its rules?', {
      name: this.getName(data),
    });

  onSubmit = (item) => globalL7PolicyStore.delete({ id: item.id });
}
