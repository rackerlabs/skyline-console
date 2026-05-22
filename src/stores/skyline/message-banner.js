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
import { get } from 'lodash';
import client from 'client';
import Base from 'stores/base';

export class MessageBannerStore extends Base {
  @observable
  activeBanners = [];

  @observable
  publicBanners = [];

  @observable
  isActiveLoading = false;

  get client() {
    return client.skyline.messageBanner;
  }

  get needGetProject() {
    return false;
  }

  async listDidFetch(items, _allProjects, filters) {
    const { tab } = filters || {};
    if (!tab || !['maintenance', 'notification'].includes(tab)) {
      return items.filter((it) => it.type === 'maintenance');
    }
    return items.filter((it) => it.type === tab);
  }

  @action
  async fetchActive(params) {
    this.isActiveLoading = true;
    try {
      const result = await this.client.active(params);
      this.activeBanners = get(result, 'message_banners', []);
      return this.activeBanners;
    } finally {
      this.isActiveLoading = false;
    }
  }

  @action
  async fetchPublic(params) {
    try {
      const result = await this.client.public(params);
      this.publicBanners = get(result, 'message_banners', []);
      return this.publicBanners;
    } catch (e) {
      this.publicBanners = [];
      return [];
    }
  }

  @action
  create(data) {
    return this.submitting(this.client.create(data));
  }

  @action
  edit({ id }, data) {
    return this.submitting(this.client.update(id, data));
  }

  @action
  update({ id }, data) {
    return this.submitting(this.client.update(id, data));
  }

  @action
  batchDelete(rowKeys) {
    return this.submitting(
      Promise.all(rowKeys.map((id) => this.client.delete(id)))
    );
  }
}

const globalMessageBannerStore = new MessageBannerStore();
export default globalMessageBannerStore;
