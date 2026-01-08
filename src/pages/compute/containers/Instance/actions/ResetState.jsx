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
import { isArray } from 'lodash';
import { checkStatus } from 'resources/nova/instance';
import globalServerStore from 'stores/nova/instance';

export default class ResetState extends ConfirmAction {
  get id() {
    return 'reset-state';
  }

  get title() {
    return t('Reset State');
  }

  get buttonText() {
    return t('Reset State');
  }

  get actionName() {
    return t('reset state');
  }

  get isDanger() {
    return true;
  }

  get passiveAction() {
    return t('have its state reset');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:os-admin-actions:reset_state';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return this.isErrorStatus(item) && this.isNotLocked(item);
  };

  performErrorMsg = (failedItems) => {
    const items = isArray(failedItems) ? failedItems : [failedItems];
    const statusErrorItems = items.filter((it) => !this.isErrorStatus(it));
    const lockedItems = items.filter((it) => !this.isNotLocked(it));
    const msgs = [];
    if (statusErrorItems.length) {
      msgs.push(
        t(
          'Instance "{ name }" is not in error status, can not reset its state.',
          { name: this.getName(statusErrorItems) }
        )
      );
    }
    if (lockedItems.length) {
      msgs.push(
        t('Instance "{ name }" is locked, can not reset its state.', {
          name: this.getName(lockedItems),
        })
      );
    }
    return msgs.map((it) => <p>{it}</p>);
  };

  confirmContext = (data) => {
    const name = this.getName(data);
    return (
      <div>
        <p>
          {this.unescape(
            t(
              'Are you sure you want to reset the state of "{name}" to Active?',
              {
                name,
              }
            )
          )}
        </p>
        <p>
          {t(
            'If the server is in an Error state due to a failed migration or resize, this is likely not the correct fix. Resetting the server state may be destructive and could make recovery more difficult. Do you wish to continue?'
          )}
        </p>
      </div>
    );
  };

  onSubmit = (item) => {
    const { id } = item || this.item;
    return globalServerStore.resetState({ id });
  };

  isErrorStatus(instance) {
    return checkStatus(['error'], instance);
  }

  isNotLocked(instance) {
    return !instance?.locked;
  }
}
