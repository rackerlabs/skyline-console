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

import React from 'react';
import { Alert } from 'antd';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalObjectStore, { ObjectStore } from 'stores/swift/object';
import globalContainerStore from 'stores/swift/container';
import globalSwiftInfoStore from 'stores/swift/info';
import { allCanChangePolicy } from 'resources/skyline/policy';
import { VERSIONING_ENABLED } from 'resources/swift/versioning';

export class UploadFile extends ModalAction {
  static id = 'upload-file';

  static title = t('Upload File');

  static policy = allCanChangePolicy;

  init() {
    this.store = new ObjectStore();
    this.maxSize = 5;
    this.state = {
      ...this.state,
      versioningEnabled: false,
    };
    this.loadVersioning();
  }

  get containerName() {
    return (globalObjectStore.container || {}).name;
  }

  // Whether the target container currently has object versioning Enabled.
  // Only asks Swift when /info advertises object_versioning.
  async isVersioningEnabled(refresh = false) {
    const name = this.containerName;
    if (!name) {
      return false;
    }
    const supported = await globalSwiftInfoStore.fetchInfo();
    if (!supported) {
      return false;
    }
    if (refresh) {
      globalContainerStore.clearVersioning(name);
    }
    const info = await globalContainerStore.fetchVersioning(name);
    return !!info && info.state === VERSIONING_ENABLED;
  }

  async loadVersioning() {
    const versioningEnabled = await this.isVersioningEnabled();
    if (versioningEnabled !== this.state.versioningEnabled) {
      this.setState({ versioningEnabled });
    }
  }

  static allowed = (_, containerProps) => {
    const { isAdminPage } = containerProps;
    return Promise.resolve(!isAdminPage);
  };

  get name() {
    return t('Upload File');
  }

  get instanceName() {
    return this.values.file.name;
  }

  get hasRequestCancelCallback() {
    return true;
  }

  get defaultValue() {
    const { name, folder, prefix } = globalObjectStore.container || {};
    const destFolder = prefix || folder || '';
    return {
      container: name,
      dest_folder: destFolder,
    };
  }

  sizeValidate = (rule, value) => {
    if (!value) {
      return Promise.reject(t('Please select a file'));
    }
    const { size } = value;
    if (size <= this.maxSize * 1024 * 1024 * 1024) {
      return Promise.resolve();
    }
    return Promise.reject(
      t(
        'Please upload files smaller than { size }GiB on the page. It is recommended to upload files over { size }GiB using API.',
        { size: this.maxSize }
      )
    );
  };

  get formItems() {
    const { folder, prefix } = globalObjectStore.container || {};
    const destFolder = prefix || folder || '';
    return [
      {
        name: 'container',
        label: t('Container Name'),
        type: 'label',
      },
      {
        name: 'dest_folder',
        label: t('Dest Folder'),
        type: 'label',
        hidden: !destFolder,
      },
      {
        name: 'file',
        label: t('Select File'),
        type: 'upload',
        required: true,
        validator: this.sizeValidate,
      },
      {
        type: 'label',
        display: this.state.versioningEnabled,
        wrapperCol: { xs: { span: 24 }, sm: { span: 22 } },
        component: (
          <Alert
            type="info"
            showIcon
            message={t(
              'Versioning is enabled on this container. If an object with the same name exists, a new version will be created.'
            )}
          />
        ),
      },
    ];
  }

  onSubmit = async (values) => {
    const { container, ...rest } = values;
    const config = this.getUploadRequestConf();
    // Re-read the container state so a just-suspended container is not
    // silently overwritten.
    const skipNameCheck = await this.isVersioningEnabled(true);
    return this.store.createFile(container, { ...rest, skipNameCheck }, config);
  };
}

export default inject('rootStore')(observer(UploadFile));
