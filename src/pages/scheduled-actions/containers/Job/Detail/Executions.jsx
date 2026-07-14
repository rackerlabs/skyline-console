import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import { JobExecutionStore } from 'stores/qonos/job-execution';
import { jobStatus } from 'resources/qonos';

export class JobExecutions extends Base {
  init() {
    this.store = new JobExecutionStore();
    this.downloadStore = new JobExecutionStore();
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'qonos:jobs:get';
  }

  get name() {
    return t('executions');
  }

  get hideSearch() {
    return true;
  }

  get hideDownload() {
    return true;
  }

  get actionConfigs() {
    return {
      rowActions: {},
      batchActions: [],
      primaryActions: [],
    };
  }

  updateFetchParams = (params) => ({
    ...params,
    jobId: this.props.detail.id,
  });

  getColumns = () => [
    {
      title: t('ID'),
      dataIndex: 'id',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      valueMap: jobStatus,
    },
    {
      title: t('Started At'),
      dataIndex: 'started_at',
      valueRender: 'toLocalTime',
    },
    {
      title: t('Ended At'),
      dataIndex: 'ended_at',
      valueRender: 'toLocalTime',
    },
    {
      title: t('Worker ID'),
      dataIndex: 'worker_id',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(JobExecutions));
