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

import { ConfirmAction } from 'containers/Action';
import { isFile } from 'resources/swift/container';
import globalContainerStore from 'stores/swift/container';
import { allCanReadPolicy } from 'resources/skyline/policy';
import { swiftEndpoint } from 'client/client/constants';
import globalRootStore from 'stores/root';
import Notify from 'components/Notify';

export default class CopyPublicUrl extends ConfirmAction {
  get id() {
    return 'copy-public-url';
  }

  get title() {
    return t('Copy Public URL');
  }

  get name() {
    return this.title;
  }

  get actionName() {
    return t('copy public URL');
  }

  get buttonText() {
    return this.title;
  }

  policy = allCanReadPolicy;

  getItemName = (item) => item.shortName;

  get messageHasItemName() {
    return true;
  }

  get isAsyncAction() {
    return false;
  }

  submitSuccessMsg = (data) => {
    const name = this.getName(data);
    return t('Public URL for "{name}" copied to clipboard.', { name });
  };

  confirmContext = (data) => {
    const name = this.getName(data);
    return t('Copy the public URL for "{name}" to clipboard?', { name });
  };

  allowedCheckFunc = async (item) => {
    if (!isFile(item)) {
      return false;
    }

    const { container } = item;
    if (!container) {
      return false;
    }

    try {
      const result = await globalContainerStore.client.showMetadata(container);
      const { headers = {} } = result;
      const isPublic = !!headers['x-container-read'];
      return isPublic;
    } catch (e) {
      return false;
    }
  };

  getPublicUrl = (container, objectPath) => {
    let swiftPublicEndpoint = swiftEndpoint();
    if (!swiftPublicEndpoint) {
      throw new Error('Swift public endpoint not available');
    }

    if (swiftPublicEndpoint.startsWith('/')) {
      swiftPublicEndpoint = `${window.location.origin}${swiftPublicEndpoint}`;
    }

    const projectId =
      globalContainerStore.client?.project ||
      globalRootStore?.user?.project?.id ||
      globalRootStore?.projectId;
    if (!projectId) {
      throw new Error('Project ID not available');
    }

    const cleanEndpoint = swiftPublicEndpoint.replace(/\/$/, '');
    const baseUrl = cleanEndpoint.includes('/v1')
      ? cleanEndpoint
      : `${cleanEndpoint}/v1`;

    const encodedPath = objectPath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${baseUrl}/AUTH_${projectId}/${container}/${encodedPath}`;
  };

  copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      document.body.removeChild(textArea);
      Notify.error(
        t('Unable to copy URL to clipboard. Please copy manually:'),
        text
      );
      throw err;
    }
  };

  onSubmit = async (item) => {
    const { container, name } = item;
    if (!container || !name) {
      Notify.error(
        t('Unable to generate public URL. Missing container or object name.')
      );
      return Promise.reject(new Error('Missing container or object name'));
    }

    const publicUrl = this.getPublicUrl(container, name);
    await this.copyToClipboard(publicUrl);
  };
}
