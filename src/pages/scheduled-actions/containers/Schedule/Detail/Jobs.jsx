import { inject, observer } from 'mobx-react';
import { JobStore } from 'stores/qonos/job';
import Job from '../../Job';

export class ScheduleJobs extends Job {
  init() {
    this.store = new JobStore();
    this.downloadStore = new JobStore();
  }

  get hideSearch() {
    return true;
  }

  get hideDownload() {
    return true;
  }

  get actionConfigs() {
    return {
      rowActions: {
        firstAction: null,
        moreActions: [],
      },
      batchActions: [],
      primaryActions: [],
    };
  }

  updateFetchParams = (params) => ({
    ...params,
    schedule_id: this.props.detail.id,
  });
}

export default inject('rootStore')(observer(ScheduleJobs));
