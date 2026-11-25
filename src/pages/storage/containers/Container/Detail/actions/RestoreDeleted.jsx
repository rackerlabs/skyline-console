import React from 'react';
import { ConfirmAction } from 'containers/Action';
import globalObjectStore from 'stores/swift/object';
import { allCanChangePolicy } from 'resources/skyline/policy';

export default class RestoreDeleted extends ConfirmAction {
  get id() {
    return 'restore-deleted';
  }

  get title() {
    return t('Restore');
  }

  getItemName = (item) => item.shortName || item.name;

  policy = allCanChangePolicy;

  allowedCheckFunc = (item) => !!item && item.isDeleted;

  getDisabledReason = (item) =>
    item && item.isDeleted && !item.canRestore
      ? t('No recoverable data')
      : null;

  confirmContext = (data) => (
    <div>
      <p>
        {t('Are you sure to {action} (instance: {name})?', {
          action: this.actionNameDisplay || this.title,
          name: this.getName(data),
        })}
      </p>
      <p style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
        {t(
          'This restores the newest recoverable version as the current object. The delete marker remains in version history.'
        )}
      </p>
    </div>
  );

  onSubmit = (item) => globalObjectStore.undelete(item);
}
