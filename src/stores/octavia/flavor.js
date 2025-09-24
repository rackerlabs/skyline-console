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
  async fetchList(params) {
    // Fetch both flavors and flavorprofiles
    const [flavors, flavorProfiles] = await Promise.all([
      this.client.list(params),
      octaviaClient.flavorprofiles.list(),
    ]);
    // Create a map for quick lookup
    const profileMap = {};
    flavorProfiles?.flavorprofiles.forEach((profile) => {
      profileMap[profile.id] = profile;
    });
    // Merge needed fields into each flavor
    const enabledFlavors = flavors?.flavors.filter((flavor) => flavor.enabled);
    const merged = enabledFlavors?.map((flavor) => {
      const profile = profileMap[flavor.flavor_profile_id] || {};
      const flavorData = JSON.parse(profile?.flavor_data);
      return {
        ...flavor,
        loadbalancer_topology: flavorData?.loadbalancer_topology,
        compute_flavor: flavorData?.compute_flavor,
      };
    });
    return merged;
  }
}

const globalLoadBalancerFlavorStore = new LoadBalancerFlavorStore();
export default globalLoadBalancerFlavorStore;
