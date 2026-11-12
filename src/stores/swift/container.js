// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { action, observable } from 'mobx';
import client from 'client';
import featureStore from 'stores/skyline/features';
import { fetchFreezerContainers } from 'stores/freezer/swift-containers';
import {
  parseVersioningHeaders,
  VERSIONING_ENABLED,
  VERSIONING_SUSPENDED,
  VERSIONING_UNKNOWN,
} from 'resources/swift/versioning';
import Base from '../base';

export class ContainerStore extends Base {
  // container name -> parsed versioning info from its HEAD response.
  // Filled lazily (only for rows that render the Versioning column, or when
  // a row's action menu needs it), so no HEAD is sent for hidden rows.
  // Must be created with observable.map(): babel's corejs3 runtime replaces
  // `new Map()` with core-js's Map, which MobX does not auto-convert, so a
  // decorated `new Map()` would stay a plain, non-reactive Map.
  versioningMap = observable.map();

  versioningRequests = {};

  get client() {
    return client.swift.container;
  }

  get cdnClient() {
    return client.skyline.objectStorageContainers;
  }

  get listResponseKey() {
    return '';
  }

  get paramsFunc() {
    return (params) => {
      return {
        ...params,
        format: 'json',
      };
    };
  }

  get mapper() {
    return (data) => ({
      ...data,
      id: data.name,
    });
  }

  async detailFetchByClient(resourceParams) {
    const { name } = resourceParams;
    const result = await this.client.showMetadata(name);
    const { headers = {} } = result;
    const isPublic = !!headers['x-container-read'];
    let link = null;
    if (isPublic) {
      link = this.client.url(name);
    }
    const cdn = await this.fetchCDNInfo(name);
    const data = {
      used: headers['x-container-bytes-used'],
      object_count: headers['x-container-object-count'],
      storage_policy: headers['x-storage-policy'],
      timestamp: headers['x-timestamp'],
      is_public: isPublic,
      link,
      versioning: parseVersioningHeaders(headers),
      ...cdn,
    };
    return data;
  }

  @action
  setVersioning(name, info) {
    this.versioningMap.set(name, info);
  }

  @action
  clearVersioning(name) {
    delete this.versioningRequests[name];
    this.versioningMap.delete(name);
  }

  // HEAD the container once and cache its versioning info. Concurrent callers
  // (the list cell and the row action menu) share the same request.
  fetchVersioning(name) {
    if (this.versioningRequests[name]) {
      return this.versioningRequests[name];
    }
    if (this.versioningMap.has(name)) {
      return Promise.resolve(this.versioningMap.get(name));
    }
    const request = this.client.showMetadata(name).then(
      (result) => {
        const info = parseVersioningHeaders((result && result.headers) || {});
        if (this.versioningRequests[name] === request) {
          this.setVersioning(name, info);
          delete this.versioningRequests[name];
        }
        return info;
      },
      () => {
        const info = {
          state: VERSIONING_UNKNOWN,
          legacyLocation: '',
          syncTo: '',
        };
        if (this.versioningRequests[name] === request) {
          this.setVersioning(name, info);
          delete this.versioningRequests[name];
        }
        return info;
      }
    );
    this.versioningRequests[name] = request;
    return request;
  }

  // POST X-Versions-Enabled. The cached state only changes on success.
  @action
  updateVersioning = async (name, enabled) => {
    const headers = {
      'X-Versions-Enabled': enabled ? 'true' : 'false',
    };
    const result = await this.submitting(
      this.client.updateMetadata(name, headers)
    );
    const current = this.versioningMap.get(name) || {
      legacyLocation: '',
      syncTo: '',
    };
    this.setVersioning(name, {
      ...current,
      state: enabled ? VERSIONING_ENABLED : VERSIONING_SUSPENDED,
    });
    return result;
  };

  @action
  clearData() {
    super.clearData();
    this.versioningMap.clear();
    this.versioningRequests = {};
  }

  // Read CDN state and public URLs for a single container via the backend
  // (which issues a HEAD to the CDN Swift endpoint). Falls back to a disabled
  // state on error so the UI never gets stuck.
  async fetchCDNInfo(name) {
    if (!featureStore.isEnabled('storage_swift_cdn')) return {};
    try {
      const result = await this.cdnClient.show(name);
      const data = result.container || result;
      return {
        cdn_enabled: !!data.cdn_enabled,
        public_http_url: data.public_http_url || null,
        public_https_url: data.public_https_url || null,
      };
    } catch (e) {
      return {
        cdn_enabled: false,
        public_http_url: null,
        public_https_url: null,
      };
    }
  }

  async listDidFetch(items) {
    if (!items || !items.length) {
      return items;
    }
    const [freezerContainers, enrichedItems] = await Promise.all([
      fetchFreezerContainers(),
      this.fetchCDNList(items),
    ]);
    return enrichedItems.map((item) => ({
      ...item,
      isFreezerContainer: freezerContainers.has(item.name),
    }));
  }

  // Enrich the container list with CDN metadata in a single batched backend
  // call rather than letting the frontend issue one HEAD request per row.
  async fetchCDNList(items) {
    if (
      !featureStore.isEnabled('storage_swift_cdn') ||
      !items ||
      items.length === 0
    ) {
      return items;
    }
    try {
      const result = await this.cdnClient.list();
      const containers = (result && result.containers) || [];
      const cdnMap = {};
      containers.forEach((c) => {
        cdnMap[c.name] = c;
      });
      return items.map((item) => {
        const cdn = cdnMap[item.name] || {};
        return {
          ...item,
          cdn_enabled: !!cdn.cdn_enabled,
          public_http_url: cdn.public_http_url || null,
          public_https_url: cdn.public_https_url || null,
        };
      });
    } catch (e) {
      return items.map((item) => ({
        ...item,
        cdn_enabled: false,
        public_http_url: null,
        public_https_url: null,
      }));
    }
  }

  @action
  checkName = async (name) => {
    try {
      await this.client.showMetadata(name);
      const err = {
        response: {
          data: t('A container with the same name already exists'),
        },
      };
      return Promise.reject(err);
    } catch (e) {
      return true;
    }
  };

  @action
  async create(data) {
    const { name, isPublic, versioning } = data;
    await this.checkName(name);
    // Object versioning is requested on the single container PUT; no header
    // is sent when the switch is off.
    const headers = versioning ? { 'X-Versions-Enabled': 'true' } : undefined;
    this.clearVersioning(name);
    if (!isPublic) {
      return this.submitting(this.client.create(name, headers));
    }
    this.isSubmitting = true;
    try {
      await this.client.create(name, headers);
    } catch (e) {
      this.isSubmitting = false;
      throw e;
    }
    return this.updatePublic(name, isPublic);
  }

  @action
  delete = async ({ id }) => {
    try {
      const result = await this.submitting(this.client.delete(id));
      this.clearVersioning(id);
      return result;
    } catch (error) {
      if (error?.response?.status === 409) {
        const message = t(
          'Cannot delete container "{name}". The container is not empty.',
          {
            name: id,
          }
        );
        const transformedError = new Error(message);
        transformedError.response = { data: message, status: 409 };
        return Promise.reject(transformedError);
      }
      return Promise.reject(error);
    }
  };

  @action
  updatePublic = async (name, isPublic) => {
    const headers = {
      'X-Container-Read': isPublic ? '.r:*,.rlistings' : '',
    };
    return this.submitting(this.client.updateMetadata(name, headers));
  };

  // Toggle CDN for a container. The backend performs the PUT with
  // X-CDN-Enabled and re-reads the authoritative state via HEAD.
  @action
  updateCDN = async (name, enabled) =>
    this.submitting(this.cdnClient.updateCDN(name, enabled));
}

const globalContainerStore = new ContainerStore();
export default globalContainerStore;
