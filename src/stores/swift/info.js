import { action, observable } from 'mobx';
import httpRequest from 'client/client/request';
import { swiftEndpoint } from 'client/client/constants';

// Swift capabilities (GET <swift>/info) cached per region.
//
// The request is made at most once per region for the whole browser session:
// the promise is cached, including failures, so navigating between storage
// pages never re-requests /info for a region that was already asked.
// Switching region yields a different cache key and triggers one new fetch.
export class SwiftInfoStore {
  // region -> boolean (object_versioning present in /info). Created with
  // observable.map() because babel's corejs3 runtime swaps `new Map()` for
  // core-js's Map, which MobX would leave as a plain, non-reactive Map.
  versioningByRegion = observable.map();

  requests = {};

  get regionKey() {
    const globalRootStore = require('stores/root').default;
    const { region } = (globalRootStore && globalRootStore.user) || {};
    return region || swiftEndpoint() || '';
  }

  get isVersioningSupported() {
    return !!this.versioningByRegion.get(this.regionKey);
  }

  @action
  setVersioningSupported(region, supported) {
    this.versioningByRegion.set(region, !!supported);
  }

  // Returns a promise resolving to whether object versioning is supported for
  // the current region. Never rejects: any failure means "no versioning".
  fetchInfo() {
    const endpoint = swiftEndpoint();
    if (!endpoint) {
      return Promise.resolve(false);
    }
    const region = this.regionKey;
    if (this.requests[region]) {
      return this.requests[region];
    }
    const url = `${endpoint.replace(/\/+$/, '')}/info`;
    // Bounded so a hanging /info can't block the Containers list.
    const options = { timeout: 15000 };
    this.requests[region] = httpRequest.request.get(url, {}, options).then(
      (info) => {
        if (!info || typeof info !== 'object' || Array.isArray(info)) {
          // eslint-disable-next-line no-console
          console.warn(
            `Swift /info for region "${region}" returned an unexpected body; object versioning UI is disabled.`
          );
          this.setVersioningSupported(region, false);
          return false;
        }
        const supported = Object.prototype.hasOwnProperty.call(
          info,
          'object_versioning'
        );
        this.setVersioningSupported(region, supported);
        return supported;
      },
      (error) => {
        const status = error && error.response && error.response.status;
        // eslint-disable-next-line no-console
        console.warn(
          `Swift /info for region "${region}" failed (${
            status || (error && error.message) || 'network error'
          }); object versioning UI is disabled.`
        );
        this.setVersioningSupported(region, false);
        return false;
      }
    );
    return this.requests[region];
  }
}

const globalSwiftInfoStore = new SwiftInfoStore();
export default globalSwiftInfoStore;
