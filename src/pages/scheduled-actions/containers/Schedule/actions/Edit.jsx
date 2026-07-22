import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';
import {
  buildScheduleBody,
  cronPresetOptions,
  getScheduleDefaultValue,
  retentionTypeOptions,
  validateCronExpression,
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
    return ['retention_type', 'cron_preset'];
  }

  get currentRetentionType() {
    return (
      this.state.retention_type || this.defaultValue.retention_type || 'none'
    );
  }

  cronValidator = (rule, value) => {
    const message = validateCronExpression(value);
    return message ? Promise.reject(new Error(message)) : Promise.resolve();
  };

  retentionValidator = (rule, value) => {
    if (value && Number(value) < 1) {
      return Promise.reject(new Error(t('Value must be greater than 0.')));
    }
    return Promise.resolve();
  };

  onValuesChange = (changedFields) => {
    const { cron_preset, retention_type } = changedFields;
    if (cron_preset && cron_preset !== 'custom') {
      this.updateFormValue('cron_expression', cron_preset);
    }
    if (retention_type !== undefined) {
      this.setState({ retention_type });
    }
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
      {
        name: 'cron_preset',
        label: t('Cron Preset'),
        type: 'select',
        options: cronPresetOptions,
        required: true,
      },
      {
        name: 'cron_expression',
        label: t('Cron Expression'),
        type: 'input',
        required: true,
        validator: this.cronValidator,
        tip: t('Use five fields: minute hour day-of-month month day-of-week.'),
      },
      {
        name: 'webhook_url',
        label: t('Webhook URL'),
        type: 'input',
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
          'Count keeps the last N snapshots/backups. Age keeps snapshots/backups for N days.'
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
        tip: t('Keep the last N snapshots or backups.'),
      },
      {
        name: 'retention_age_days',
        label: t('Number of Days'),
        type: 'input-number',
        min: 1,
        required: retentionType === 'age',
        hidden: retentionType !== 'age',
        validator: this.retentionValidator,
        tip: t('Keep snapshots or backups for N days.'),
      },
    ];
  }

  onSubmit = (values) =>
    this.store.edit({ id: this.item.id }, buildScheduleBody(values, true));
}

export default inject('rootStore')(observer(Edit));
