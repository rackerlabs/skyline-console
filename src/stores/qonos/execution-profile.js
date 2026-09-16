import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';
import { enrichExecutionProfilesWithTrustProject } from 'resources/qonos';

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

  async listDidFetch(items, allProjects) {
    if (!allProjects) {
      return items;
    }
    return enrichExecutionProfilesWithTrustProject(items);
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
