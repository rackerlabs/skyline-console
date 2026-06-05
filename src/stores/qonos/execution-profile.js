import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';

export class ExecutionProfileStore extends Base {
  get client() {
    return client.qonos.executionProfiles;
  }

  get needGetProject() {
    return false;
  }

  get paramsFunc() {
    return (params = {}) => {
      const { marker, limit, enabled, auth_type } = params;
      return { marker, limit, enabled, auth_type };
    };
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

const globalExecutionProfileStore = new ExecutionProfileStore();
export default globalExecutionProfileStore;
