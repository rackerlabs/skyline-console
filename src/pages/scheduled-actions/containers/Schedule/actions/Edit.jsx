import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';
import {
  SCHEDULE_FREQUENCIES,
  buildScheduleBody,
  getScheduleDefaultValue,
  getScheduleTimingFormItems,
  retentionTypeOptions,
  webhookUrlValidator,
} from 'resources/qonos';

export class Edit extends ModalAction {
  static id = 'edit-qonos-schedule';

  static title = t('Edit Schedule');

  static buttonText = t('Edit');

  static aliasPolicy = 'qonos:schedules:update';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalScheduleStore;
  }

  get name() {
    return t('Edit schedule');
  }

  get defaultValue() {
    return getScheduleDefaultValue(this.item);
  }

  get nameForStateUpdate() {
    return ['retention_type', 'schedule_frequency'];
  }

  get currentRetentionType() {
    return (
      this.state.retention_type || this.defaultValue.retention_type || 'none'
    );
  }

  get currentFrequency() {
    return (
      this.state.schedule_frequency ||
      this.defaultValue.schedule_frequency ||
      SCHEDULE_FREQUENCIES.DAILY
    );
  }

  retentionValidator = (rule, value) => {
    if (value && Number(value) < 1) {
      return Promise.reject(new Error(t('Value must be greater than 0.')));
    }
    return Promise.resolve();
  };

  get formItems() {
    const retentionType = this.currentRetentionType;
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        placeholder: t('Please input name'),
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        rows: 3,
      },
      {
        type: 'divider',
      },
      ...getScheduleTimingFormItems(this.currentFrequency),
      {
        name: 'webhook_url',
        label: t('Webhook URL'),
        type: 'input',
        validator: webhookUrlValidator,
      },
      {
        type: 'divider',
      },
      {
        name: 'retention_type',
        label: t('Retention'),
        type: 'radio',
        options: retentionTypeOptions,
        tip: t(
          'Count keeps the newest N snapshots/backups created by the schedule. Age keeps snapshots/backups that are N days old or younger; older ones are deleted.'
        ),
      },
      {
        name: 'retention_count',
        label: t('Number of Snapshots/Backups'),
        type: 'input-number',
        min: 1,
        required: retentionType === 'count',
        hidden: retentionType !== 'count',
        validator: this.retentionValidator,
        tip: t(
          'Keep the newest N snapshots or backups created by the schedule.'
        ),
      },
      {
        name: 'retention_age_days',
        label: t('Number of Days'),
        type: 'input-number',
        min: 1,
        required: retentionType === 'age',
        hidden: retentionType !== 'age',
        validator: this.retentionValidator,
        tip: t(
          'Keep snapshots or backups that are N days old or younger. Older ones are deleted.'
        ),
      },
    ];
  }

  onSubmit = (values) =>
    this.store.edit({ id: this.item.id }, buildScheduleBody(values, true));
}

export default inject('rootStore')(observer(Edit));
