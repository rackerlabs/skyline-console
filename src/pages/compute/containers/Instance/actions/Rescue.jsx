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

import React from 'react';
import { ConfirmAction } from 'containers/Action';
import {
  isNotLockedOrAdmin,
  checkStatus,
  isIronicInstance,
} from 'resources/nova/instance';
import globalServerStore from 'stores/nova/instance';
import styles from './index.less';

export default class RescueAction extends ConfirmAction {
  get id() {
    return 'rescue';
  }

  get title() {
    return t('Rescue Instance');
  }

  get buttonText() {
    return t('Rescue');
  }

  get actionName() {
    return t('rescue instance');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:os-rescue:rescue';

  isStatusOk = (item) =>
    checkStatus(['active', 'shutoff', 'paused', 'suspended'], item);

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return (
      isNotLockedOrAdmin(item, this.isAdminPage) &&
      this.isStatusOk(item) &&
      !isIronicInstance(item)
    );
  };

  confirmContext = (data) => {
    const { name } = data;
    return (
      <div>
        <p className={styles.mb16}>
          {this.unescape(
            t('Are you sure you want to rescue the instance { name }?', {
              name,
            })
          )}
        </p>
        <p>
          {t(
            'After rescuing, the instance will boot into rescue mode with a rescue image, allowing you to troubleshoot and repair the instance. This operation may take a few minutes. Once completed, you can revert the instance to its original state.'
          )}
        </p>
      </div>
    );
  };

  onSubmit = () => {
    const { id } = this.item;
    return globalServerStore.rescue({ id });
  };
}
