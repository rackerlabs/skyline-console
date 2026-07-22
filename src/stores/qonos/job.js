import { action } from 'mobx';
import Base from 'stores/base';
import client from 'client';
import { mapActionTarget } from 'resources/qonos';

export class JobStore extends Base {
  get client() {
    return client.qonos.jobs;
  }

  get needGetProject() {
    return false;
  }

  get paramsFunc() {
    return (params = {}) => {
      const {
        marker,
        limit,
        schedule_id,
        status,
        action_type,
        created_after,
        created_before,
      } = params;
      return {
        marker,
        limit,
        schedule_id,
        status,
        action_type,
        created_after,
        created_before,
      };
    };
  }

  get mapper() {
    return (data) => ({ ...data, ...mapActionTarget(data) });
  }

  async listDidFetch(items, _allProjects, filters) {
    const scheduleId = filters?.schedule_id;
    return scheduleId
      ? items.filter((item) => item.schedule_id === scheduleId)
      : items;
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }

  @action
  cancel({ id }) {
    return this.submitting(this.client.cancel(id));
  }
}

const globalJobStore = new JobStore();
export default globalJobStore;
