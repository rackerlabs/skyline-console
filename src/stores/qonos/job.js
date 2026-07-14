import { action } from 'mobx';
import Base from 'stores/base';
import client from 'client';

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
    return (data) => ({
      ...data,
      server_id: (data.action_parameters || {}).server_id,
    });
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
