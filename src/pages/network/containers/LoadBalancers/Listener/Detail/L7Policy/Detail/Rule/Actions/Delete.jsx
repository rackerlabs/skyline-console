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
import globalL7RuleStore from 'stores/octavia/l7rule';
import { canChangeRule } from '../helpers';

export default class Delete extends ConfirmAction {
  get id() {
    return 'l7rule-delete';
  }

  get title() {
    return t('Delete L7 Rule');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete L7 Rule');
  }

  get isDanger() {
    return true;
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_load-balancer_api:l7rule:delete';

  allowedCheckFunc = (item) =>
    canChangeRule(item, this.containerProps?.detail, true);

  confirmContext = (item) => t('Delete L7 rule {name}?', { name: item.id });

  onSubmit = (item) =>
    globalL7RuleStore.delete({
      id: item.id,
      l7policy_id: this.containerProps.detail.id,
    });
}
