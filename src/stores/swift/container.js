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

import { action } from 'mobx';
import client from 'client';
import Base from '../base';

export class ContainerStore extends Base {
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
      ...cdn,
    };
    return data;
  }

  // Read CDN state and public URLs for a single container via the backend
  // (which issues a HEAD to the CDN Swift endpoint). Falls back to a disabled
  // state on error so the UI never gets stuck.
  async fetchCDNInfo(name) {
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

  // Enrich the container list with CDN metadata in a single batched backend
  // call rather than letting the frontend issue one HEAD request per row.
  async listDidFetch(items) {
    if (!items || items.length === 0) {
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
    const { name, isPublic } = data;
    await this.checkName(name);
    if (!isPublic) {
      return this.submitting(this.client.create(name));
    }
    this.isSubmitting = true;
    await this.client.create(name);
    return this.updatePublic(name, isPublic);
  }

  @action
  delete = async ({ id }) => {
    try {
      return await this.submitting(this.client.delete(id));
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
