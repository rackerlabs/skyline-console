import React from 'react';
import { ConfirmAction } from 'src/containers/Action';
import globalServerStore from 'src/stores/nova/instance';
import { isNotLockedOrAdmin, checkStatus } from 'resources/nova/instance';
import { isArray } from 'lodash';

export default class UnRescueInstanceAction extends ConfirmAction {
  get id() {
    return 'unrescue';
  }

  get title() {
    return t('Unrescue Instance');
  }

  get buttonText() {
    return t('Unrescue');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:servers:unrescue';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    // Allow Unrescue only if instance is rescue and not locked
    return (
      isNotLockedOrAdmin(item, this.isAdminPage) &&
      checkStatus(['rescue'], item)
    );
  };

  performErrorMsg = (failedItems) => {
    const items = isArray(failedItems) ? failedItems : [failedItems];
    const statusErrorItems = items.filter((it) => !this.canReboot(it));
    const lockedItems = items.filter(
      (it) => !isNotLockedOrAdmin(it, this.isAdminPage)
    );
    const msgs = [];
    if (statusErrorItems.length) {
      msgs.push(
        t(
          'Instance "{ name }" status is not in rescue state, can not unrescue it.',
          { name: this.getName(statusErrorItems) }
        )
      );
    }
    if (lockedItems.length) {
      msgs.push(
        t('Instance "{ name }" is locked, can not unrescue it.', {
          name: this.getName(lockedItems),
        })
      );
    }
    return msgs.map((it) => <p>{it}</p>);
  };

  onSubmit = (item) => {
    const { id } = item || this.item;
    return globalServerStore.unrescue({ id });
  };
}
