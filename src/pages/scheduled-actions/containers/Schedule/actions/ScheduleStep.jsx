import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import { cronPresetOptions, validateCronExpression } from 'resources/qonos';

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
      retention_count_enabled: false,
      retention_age_enabled: false,
    };
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
    const { cron_preset } = changedFields;
    if (cron_preset && cron_preset !== 'custom') {
      this.updateFormValue('cron_expression', cron_preset);
    }
  };

  get formItems() {
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
        name: 'retention_count_enabled',
        label: t('Retention Count'),
        type: 'switch',
      },
      {
        name: 'retention_count',
        label: t('Count'),
        type: 'input-number',
        min: 1,
        validator: this.retentionValidator,
      },
      {
        name: 'retention_age_enabled',
        label: t('Retention Age'),
        type: 'switch',
      },
      {
        name: 'retention_age_days',
        label: t('Days'),
        type: 'input-number',
        min: 1,
        validator: this.retentionValidator,
      },
    ];
  }
}

export default inject('rootStore')(observer(ScheduleStep));
