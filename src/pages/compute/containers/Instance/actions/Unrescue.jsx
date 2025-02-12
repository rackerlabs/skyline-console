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

export default class UnrescueAction extends ConfirmAction {
  get id() {
    return 'unrescue';
  }

  get title() {
    return t('Unrescue Instance');
  }

  get buttonText() {
    return t('Unrescue');
  }

  get actionName() {
    return t('unrescue instance');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:os-rescue:unrescue';

  isStatusOk = (item) => checkStatus(['rescue'], item); // Unrescue should only be allowed if the instance is currently in rescue mode.

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
            t('Are you sure you want to unrescue the instance { name }?', {
              name,
            })
          )}
        </p>
        <p>
          {t(
            'After unrescuing, the instance will revert to its original state, and the rescue mode will be disabled. This operation may take a few minutes to complete.'
          )}
        </p>
      </div>
    );
  };

  onSubmit = () => {
    const { id } = this.item;
    return globalServerStore.unrescue({ id });
  };
}
