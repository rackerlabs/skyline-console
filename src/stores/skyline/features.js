import { action, observable } from 'mobx';
import client from 'client';
import { isFeatureEnabled, isPathEnabled } from 'utils/features';

export class FeatureStore {
  @observable values = {};

  @observable ready = false;

  @observable error = false;

  isEnabled = (key) => isFeatureEnabled(this.values, key);

  isPathEnabled = (path) => isPathEnabled(this.values, path);

  @action
  async fetch() {
    this.ready = false;
    this.error = false;
    try {
      const { features } = await client.skyline.features();
      if (
        !features ||
        typeof features !== 'object' ||
        Array.isArray(features)
      ) {
        throw new Error('Invalid features response');
      }
      this.values = features;
      this.ready = true;
    } catch (error) {
      this.error = true;
    }
  }

  @action
  clearData() {
    this.values = {};
    this.ready = false;
    this.error = false;
  }
}

export default new FeatureStore();
