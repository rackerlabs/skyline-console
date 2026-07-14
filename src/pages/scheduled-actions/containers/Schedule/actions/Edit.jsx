import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';
import { ExecutionProfileStore } from 'stores/qonos/execution-profile';
import { ServerStore } from 'stores/nova/instance';
import { instanceSelectTablePropsBackend } from 'resources/nova/instance';
import {
  actionTypeOptions,
  buildScheduleBody,
  cronPresetOptions,
  getScheduleDefaultValue,
  validateCronExpression,
} from 'resources/qonos';

export class Edit extends ModalAction {
  static id = 'edit-qonos-schedule';

  static title = t('Edit Schedule');

  static buttonText = t('Edit');

  static aliasPolicy = 'qonos:schedules:update';

  static allowed = () => Promise.resolve(true);

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  init() {
    this.store = globalScheduleStore;
    this.profileStore = new ExecutionProfileStore();
    this.serverStore = new ServerStore();
    this.profileStore.fetchList();
  }

  get name() {
    return t('Edit schedule');
  }

  get defaultValue() {
    return getScheduleDefaultValue(this.item);
  }

  get profileColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Trust ID'),
        dataIndex: 'trust_id',
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        valueRender: 'yesNo',
      },
    ];
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
        name: 'enabled',
        label: t('Enabled'),
        type: 'switch',
      },
      {
        name: 'action_type',
        label: t('Action Type'),
        type: 'select',
        options: actionTypeOptions,
        disabled: true,
        required: true,
      },
      {
        name: 'server',
        label: t('Instance'),
        type: 'select-table',
        backendPageStore: this.serverStore,
        backendPageFunc: 'fetchListByPage',
        rowKey: 'id',
        required: true,
        selectedLabel: t('Instance'),
        ...instanceSelectTablePropsBackend,
      },
      {
        name: 'execution_profile',
        label: t('Execution Profile'),
        type: 'select-table',
        data: this.profileStore.list.data,
        isLoading: this.profileStore.list.isLoading,
        columns: this.profileColumns,
        filterParams: [{ label: t('Name'), name: 'name' }],
        disabledFunc: (record) => !record.enabled,
        required: true,
        selectedLabel: t('Execution Profile'),
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

  onSubmit = (values) =>
    this.store.edit({ id: this.item.id }, buildScheduleBody(values, true));
}

export default inject('rootStore')(observer(Edit));
