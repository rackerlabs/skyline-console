import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import {
  cronPresetOptions,
  retentionTypeOptions,
  validateCronExpression,
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
      cron_preset: cronPresetOptions[0].value,
      cron_expression: cronPresetOptions[0].value,
      retention_type: 'none',
    };
  }

  get nameForStateUpdate() {
    return ['retention_type', 'cron_preset'];
  }

  get currentRetentionType() {
    return (
      this.state.retention_type || this.props.context?.retention_type || 'none'
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
}

export default inject('rootStore')(observer(ScheduleStep));
