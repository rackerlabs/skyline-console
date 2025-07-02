import { action } from 'mobx';
import octaviaClient from 'client/octavia';
import Base from 'stores/base';

export class LoadBalancerFlavorStore extends Base {
  get client() {
    return octaviaClient.flavors;
  }

  get listWithDetail() {
    return false;
  }

  @action
  async fetchListOnly() {
    const result = await this.client.list();
    return result;
  }
}

const globalLoadBalancerFlavorStore = new LoadBalancerFlavorStore();
export default globalLoadBalancerFlavorStore;
