import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';

export class TrustStore extends Base {
  get client() {
    return client.keystone.trusts;
  }

  get needGetProject() {
    return false;
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }
}

const globalTrustStore = new TrustStore();
export default globalTrustStore;
