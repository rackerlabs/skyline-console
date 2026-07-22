import { inject, observer } from 'mobx-react';
import { JobStore } from 'stores/qonos/job';
import { emptyActionConfig } from 'utils/constants';
import { Job } from '../../Job';

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

  get searchFilters() {
    return [];
  }

  get actionConfigs() {
    return emptyActionConfig;
  }

  get scheduleId() {
    return this.props.detail?.id || this.props.match?.params?.id;
  }

  updateFetchParams = (params) => {
    const { id, ...rest } = params;
    return { ...rest, schedule_id: this.scheduleId };
  };

  getColumns() {
    return super
      .getColumns()
      .filter(
        (c) =>
          !['schedule_id', 'action_type', 'target_id'].includes(c.dataIndex)
      );
  }
}

export default inject('rootStore')(observer(ScheduleJobs));
