import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import {
  SCHEDULE_FREQUENCIES,
  getDefaultScheduleTiming,
  getScheduleTimingFormItems,
  retentionTypeOptions,
  webhookUrlValidator,
} from 'resources/qonos';

export class ScheduleStep extends Base {
  get name() {
    return t('Schedule config');
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  get defaultValue() {
    return {
      ...getDefaultScheduleTiming(),
      retention_type: 'none',
    };
  }

  get nameForStateUpdate() {
    return ['retention_type', 'schedule_frequency'];
  }

  get currentRetentionType() {
    return (
      this.state.retention_type || this.props.context?.retention_type || 'none'
    );
  }

  get currentFrequency() {
    return (
      this.state.schedule_frequency ||
      this.props.context?.schedule_frequency ||
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
}

export default inject('rootStore')(observer(ScheduleStep));
