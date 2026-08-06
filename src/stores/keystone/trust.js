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
      const { trustor_user_id } = params;
      const newParams = {};
      if (trustor_user_id) {
        newParams.trustor_user_id = trustor_user_id;
      }
      return newParams;
    };
  }

  async listDidFetch(items = [], _allProjects, filters = {}) {
    if (filters.skipRoleFetch) {
      return items;
    }
    return Promise.all(
      items.map(async (item) => {
        if (item.roles && item.roles.length) {
          return item;
        }
        try {
          const result = await this.client.show(item.id);
          const trust = result?.trust || result || {};
          return {
            ...item,
            roles: trust.roles || [],
          };
        } catch (e) {
          return item;
        }
      })
    );
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }
}

const globalTrustStore = new TrustStore();
export default globalTrustStore;
