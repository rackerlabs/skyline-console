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

  get paramsFunc() {
    return (params = {}) => {
      const { trustor_user_id, trustee_user_id } = params;
      const newParams = {};
      if (trustor_user_id) {
        newParams.trustor_user_id = trustor_user_id;
      }
      if (trustee_user_id) {
        newParams.trustee_user_id = trustee_user_id;
      }
      return newParams;
    };
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }
}

const globalTrustStore = new TrustStore();
export default globalTrustStore;
