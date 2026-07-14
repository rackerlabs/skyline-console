import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { ScheduleStore } from 'stores/qonos/schedule';
import { formatRetentionPolicy } from 'resources/qonos';
import actionConfigs from '../actions';
import Jobs from './Jobs';

export class ScheduleDetail extends Base {
  get name() {
    return t('schedule');
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:schedules:get';
  }

  get listUrl() {
    return this.getRoutePath('qonosSchedule');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  renderRetention = (policy) => formatRetentionPolicy(policy);

  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Project ID'),
        dataIndex: 'project_id',
      },
      {
        title: t('Action Type'),
        dataIndex: 'action_type',
      },
      {
        title: t('Cron Expression'),
        dataIndex: 'cron_expression',
      },
      {
        title: t('Server ID'),
        dataIndex: 'server_id',
      },
      {
        title: t('Execution Profile ID'),
        dataIndex: 'execution_profile_id',
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        valueRender: 'yesNo',
      },
      {
        title: t('Retention Policy'),
        dataIndex: 'retention_policy',
        render: this.renderRetention,
      },
      {
        title: t('Webhook URL'),
        dataIndex: 'webhook_url',
      },
      {
        title: t('Next Run At'),
        dataIndex: 'next_run_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Last Run At'),
        dataIndex: 'last_run_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Updated At'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('Jobs'),
        key: 'jobs',
        component: Jobs,
      },
    ];
  }

  init() {
    this.store = new ScheduleStore();
  }
}

export default inject('rootStore')(observer(ScheduleDetail));
