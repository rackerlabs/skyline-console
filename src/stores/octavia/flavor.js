import client from 'client';
import Base from 'stores/base';

export class LoadBalancerFlavorStore extends Base {
  get client() {
    return client.octavia.flavors;
  }

  get listWithDetail() {
    return false;
  }

  async fetchList(params) {
    const flavors = await this.client.list(params);
    return flavors?.flavors?.filter((flavor) => flavor.enabled) || [];
  }
}

const globalLoadBalancerFlavorStore = new LoadBalancerFlavorStore();
export default globalLoadBalancerFlavorStore;
