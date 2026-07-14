import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import globalScheduleStore, { ScheduleStore } from 'stores/qonos/schedule';
import { qonosEndpoint } from 'client/client/constants';
import { actionTypeOptions } from 'resources/qonos';
import actionConfigs from './actions';

export class Schedule extends Base {
  init() {
    this.store = globalScheduleStore;
    this.downloadStore = new ScheduleStore();
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:schedules:get';
  }

  get endpoint() {
    return qonosEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('schedules');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Action Type'),
        name: 'action_type',
        options: actionTypeOptions,
      },
      {
        label: t('Enabled'),
        name: 'enabled',
        options: [
          { label: t('Yes'), value: true },
          { label: t('No'), value: false },
        ],
      },
    ];
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('qonosScheduleDetail'),
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
      title: t('Cron Expression'),
      dataIndex: 'cron_expression',
    },
    {
      title: t('Execution Profile ID'),
      dataIndex: 'execution_profile_id',
      isHideable: true,
    },
    {
      title: t('Enabled'),
      dataIndex: 'enabled',
      valueRender: 'yesNo',
    },
    {
      title: t('Next Run At'),
      dataIndex: 'next_run_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
    {
      title: t('Last Run At'),
      dataIndex: 'last_run_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Schedule));
