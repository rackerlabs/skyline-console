import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { JobStore } from 'stores/qonos/job';
import { jobStatus } from 'resources/qonos';
import actionConfigs from '../actions';
import Executions from './Executions';

export class JobDetail extends Base {
  get name() {
    return t('job');
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:jobs:get';
  }

  get listUrl() {
    return this.getRoutePath('qonosJob');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  renderActionParameters = (value) =>
    value ? JSON.stringify(value, null, 2) : '-';

  get detailInfos() {
    return [
      {
        title: t('ID'),
        dataIndex: 'id',
      },
      {
        title: t('Project ID'),
        dataIndex: 'project_id',
      },
      {
        title: t('Schedule ID'),
        dataIndex: 'schedule_id',
      },
      {
        title: t('Action Type'),
        dataIndex: 'action_type',
      },
      {
        title: t('Action Parameters'),
        dataIndex: 'action_parameters',
        render: this.renderActionParameters,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: jobStatus,
      },
      {
        title: t('Run At'),
        dataIndex: 'run_at',
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
        title: t('Executions'),
        key: 'executions',
        component: Executions,
      },
    ];
  }

  init() {
    this.store = new JobStore();
  }
}

export default inject('rootStore')(observer(JobDetail));
