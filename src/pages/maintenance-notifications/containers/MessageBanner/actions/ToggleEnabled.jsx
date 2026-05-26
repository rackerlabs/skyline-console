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
import { getMessageBannerPayload } from 'resources/skyline/message-banner';

export default class ToggleEnabledAction extends ConfirmAction {
  get id() {
    return this.item.enabled ? 'disable' : 'enable';
  }

  get title() {
    return this.item.enabled
      ? t('Disable Message Banner')
      : t('Enable Message Banner');
  }

  get buttonText() {
    return this.item.enabled ? t('Disable') : t('Enable');
  }

  get actionName() {
    return this.item.enabled
      ? t('Disable message banner')
      : t('Enable message banner');
  }

  policy = onlyAdminCanChangePolicy;

  allowed = (item) => {
    const isExpired = new Date(item.expires_at) <= new Date();
    // For rss_feed: only show toggle if currently active (not expired and enabled)
    if (item.source === 'rss_feed') {
      return Promise.resolve(!isExpired && item.enabled);
    }
    // For manual: only show toggle if not expired
    return Promise.resolve(!isExpired);
  };

  getItemName = (data) => data.title || `- (${data.id})`;

  onSubmit = (data) => {
    const values = {
      ...data,
      enabled: !data.enabled,
    };
    const body = getMessageBannerPayload(values, data.type);
    return globalMessageBannerStore.update({ id: data.id }, body);
  };
}
