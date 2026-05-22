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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalMessageBannerStore from 'stores/skyline/message-banner';
import { onlyAdminCanChangePolicy } from 'resources/skyline/policy';
import {
  formatUtcInput,
  getMessageBannerPayload,
  getMessageTypeLabel,
  utcInputPlaceholder,
  utcTimeValidator,
} from 'resources/skyline/message-banner';

export class Edit extends ModalAction {
  static id = 'edit';

  static title = t('Edit');

  static buttonText = t('Edit');

  static policy = onlyAdminCanChangePolicy;

  static allowed = (item) => Promise.resolve(item.source === 'manual');

  init() {
    this.store = globalMessageBannerStore;
  }

  get messageType() {
    return this.item.type;
  }

  get name() {
    return t('Edit {type}', {
      type: getMessageTypeLabel(this.messageType),
    });
  }

  get instanceName() {
    return this.item.title || this.item.id;
  }

  get defaultValue() {
    const {
      title,
      message,
      impacted_service,
      start_at,
      expires_at,
      region,
      enabled,
    } = this.item;
    return {
      title,
      message,
      impacted_service,
      start_at: formatUtcInput(start_at),
      expires_at: formatUtcInput(expires_at),
      region,
      enabled,
    };
  }

  getModalSize() {
    return 'large';
  }

  get formItems() {
    const isMaintenance = this.messageType === 'maintenance';
    return [
      {
        name: 'title',
        label: t('Title'),
        type: 'input',
        required: true,
      },
      {
        name: 'impacted_service',
        label: t('Impacted Service'),
        type: 'input',
        required: false,
        display: isMaintenance,
      },
      {
        name: 'start_at',
        label: t('Start_Time (UTC)'),
        type: 'input',
        placeholder: utcInputPlaceholder,
        required: isMaintenance,
        validator: utcTimeValidator,
        display: isMaintenance,
      },
      {
        name: 'expires_at',
        label: t('End_Time (UTC)'),
        type: 'input',
        placeholder: utcInputPlaceholder,
        required: true,
        validator: utcTimeValidator,
      },
      {
        name: 'message',
        label: t('Message'),
        type: 'textarea',
        required: true,
        rows: 6,
      },
    ];
  }

  onSubmit = (values) =>
    this.store.edit(
      { id: this.item.id },
      getMessageBannerPayload(values, this.messageType)
    );
}

export default inject('rootStore')(observer(Edit));
