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

import { ConfirmAction } from 'containers/Action';
import globalContainerStore from 'stores/swift/container';
import { allCanChangePolicy } from 'resources/skyline/policy';

export default class CDN extends ConfirmAction {
  get id() {
    return 'cdn';
  }

  // Use the authoritative cdn_enabled state to decide the label.
  get isEnabled() {
    return !!(this.item && this.item.cdn_enabled);
  }

  get title() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get name() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get buttonText() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get actionName() {
    return this.isEnabled ? t('disable CDN') : t('enable CDN');
  }

  policy = allCanChangePolicy;

  allowed = () => Promise.resolve(!this.isAdminPage);

  onSubmit = () => {
    const { name, id } = this.item;
    return globalContainerStore.updateCDN(name || id, !this.isEnabled);
  };

  submitErrorMsg(data, realError) {
    if (
      realError?.response?.data?.detail &&
      typeof realError.response.data.detail === 'string'
    ) {
      return realError.response.data.detail;
    }
    if (
      realError?.response?.data &&
      typeof realError.response.data === 'string'
    ) {
      return realError.response.data;
    }
    if (realError?.message && typeof realError.message === 'string') {
      return realError.message;
    }
    return super.submitErrorMsg(data, realError);
  }
}
