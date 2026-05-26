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
  getMessageBannerPayload,
  getMessageTypeLabel,
  utcInputPlaceholder,
  utcTimeValidator,
} from 'resources/skyline/message-banner';

export class Create extends ModalAction {
  static id = 'create';

  static title = t('Create Maintenance');

  static policy = onlyAdminCanChangePolicy;

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalMessageBannerStore;
  }

  get messageType() {
    return this.containerProps.tab || 'maintenance';
  }

  get name() {
    return t('Create {type}', {
      type: getMessageTypeLabel(this.messageType),
    });
  }

  get defaultValue() {
    const { region } = this.currentUser || {};
    return {
      enabled: true,
      region,
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
        type: 'date-picker',
        showTime: true,
        placeholder: utcInputPlaceholder,
        required: isMaintenance,
        validator: utcTimeValidator,
        display: isMaintenance,
      },
      {
        name: 'expires_at',
        label: t('End_Time (UTC)'),
        type: 'date-picker',
        showTime: true,
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
    this.store.create(getMessageBannerPayload(values, this.messageType));
}

export default inject('rootStore')(observer(Create));
