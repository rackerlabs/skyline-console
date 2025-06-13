import { action, observable } from 'mobx';
import client from 'client';
import Base from 'stores/base';

export class LoadBalancerFlavorStore extends Base {
  @observable
  flavorProfiles = [];

  get client() {
    return client.octavia.flavors;
  }

  get listWithDetail() {
    return false;
  }

  get mapper() {
    return (data) => {
      const profile =
        this.flavorProfiles.find((p) => p.id === data.flavor_profile_id) || {};
      return {
        ...data,
        flavor_profile_name: profile.name || '',
        provider: profile.provider_name || '',
        originData: data,
      };
    };
  }

  @action
  async fetchFlavorProfiles() {
    const result = await client.octavia.flavorprofiles.list();
    this.flavorProfiles = result || [];
  }

  @action
  async fetchListAndProfiles() {
    await this.fetchFlavorProfiles();
    const result = await this.client.list();
    return result.map(this.mapper);
  }
}

const globalLoadBalancerFlavorStore = new LoadBalancerFlavorStore();
export default globalLoadBalancerFlavorStore;
