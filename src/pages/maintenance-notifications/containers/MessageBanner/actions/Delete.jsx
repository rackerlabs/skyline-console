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
import globalMessageBannerStore from 'stores/skyline/message-banner';
import { onlyAdminCanChangePolicy } from 'resources/skyline/policy';

export default class DeleteAction extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Message Banner');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete message banner');
  }

  policy = onlyAdminCanChangePolicy;

  allowed = (item) => Promise.resolve(item.source === 'manual');

  getItemName = (data) => data.title || `- (${data.id})`;

  onSubmit = (data) => globalMessageBannerStore.delete({ id: data.id });
}
