import React from 'react';
import { ConfirmAction } from 'src/containers/Action';
import globalServerStore from 'src/stores/nova/instance';
import { isNotLockedOrAdmin, checkStatus } from 'resources/nova/instance';
import { isArray } from 'lodash';

export default class RescueInstanceAction extends ConfirmAction {
  get id() {
    return 'rescue';
  }

  get title() {
    return t('Rescue Instance');
  }

  get buttonText() {
    return t('Rescue');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:servers:rescue';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    // Allow rescue if instance is active or shutoff and not locked
    return (
      isNotLockedOrAdmin(item, this.isAdminPage) &&
      checkStatus(['active', 'shutoff', 'error'], item)
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
          'Instance "{ name }" status is not in active or shutoff, can not rescue it.',
          { name: this.getName(statusErrorItems) }
        )
      );
    }
    if (lockedItems.length) {
      msgs.push(
        t('Instance "{ name }" is locked, can not rescue it.', {
          name: this.getName(lockedItems),
        })
      );
    }
    return msgs.map((it) => <p>{it}</p>);
  };

  onSubmit = (item) => {
    const { id } = item || this.item;
    return globalServerStore.rescue({ id });
  };
}
