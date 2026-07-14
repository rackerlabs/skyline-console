import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';
import { formatRetentionPolicy } from 'resources/qonos';

export class ScheduleStore extends Base {
  get client() {
    return client.qonos.schedules;
  }

  get needGetProject() {
    return false;
  }

  get paramsFunc() {
    return (params = {}) => {
      const { marker, limit } = params;
      return { marker, limit };
    };
  }

  get mapper() {
    return (data) => ({
      ...data,
      server_id: (data.action_parameters || {}).server_id,
      retention: formatRetentionPolicy(data.retention_policy),
    });
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }

  @action
  edit({ id }, body) {
    return this.submitting(this.client.update(id, body));
  }

  @action
  update({ id }, body) {
    return this.submitting(this.client.update(id, body));
  }

  @action
  toggleEnabled({ id }, enabled) {
    return this.submitting(this.client.update(id, { enabled }));
  }
}

const globalScheduleStore = new ScheduleStore();
export default globalScheduleStore;
