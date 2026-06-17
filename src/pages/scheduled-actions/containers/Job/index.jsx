import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import globalJobStore, { JobStore } from 'stores/qonos/job';
import { qonosEndpoint } from 'client/client/constants';
import { actionTypeOptions, jobStatus } from 'resources/qonos';
import actionConfigs from './actions';

export class Job extends Base {
  init() {
    this.store = globalJobStore;
    this.downloadStore = new JobStore();
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:jobs:get';
  }

  get endpoint() {
    return qonosEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('jobs');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get searchFilters() {
    return [
      {
        label: t('Schedule ID'),
        name: 'schedule_id',
      },
      {
        label: t('Action Type'),
        name: 'action_type',
        options: actionTypeOptions,
      },
      {
        label: t('Status'),
        name: 'status',
        options: Object.keys(jobStatus).map((key) => ({
          label: jobStatus[key],
          value: key,
        })),
      },
    ];
  }

  getColumns = () => [
    {
      title: t('ID'),
      dataIndex: 'id',
      routeName: this.getRouteName('qonosJobDetail'),
    },
    {
      title: t('Schedule ID'),
      dataIndex: 'schedule_id',
      isHideable: true,
    },
    {
      title: t('Action Type'),
      dataIndex: 'action_type',
    },
    {
      title: t('Server ID'),
      dataIndex: 'server_id',
      isHideable: true,
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
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Job));
