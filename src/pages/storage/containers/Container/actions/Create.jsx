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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalContainerStore from 'stores/swift/container';
import globalSwiftInfoStore from 'stores/swift/info';
import { allCanChangePolicy } from 'resources/skyline/policy';
import { getSwiftErrorBody } from 'resources/swift/versioning';
import { getSwiftErrorFormItem } from './SwiftError';

export class Create extends ModalAction {
  static id = 'create';

  static title = t('Create Container');

  static policy = allCanChangePolicy;

  // Submit errors are rendered inside the modal, which stays open.
  static keepModalOnSubmitError = true;

  static allowed = (_, containerProps) => {
    const { isAdminPage } = containerProps;
    return Promise.resolve(!isAdminPage);
  };

  init() {
    this.state = {
      ...this.state,
      swiftError: null,
    };
    this.hasInlineError = false;
    // Cached per region; normally already resolved by the Containers page.
    globalSwiftInfoStore.fetchInfo();
  }

  get name() {
    return t('Create Container');
  }

  get showNotice() {
    return !this.hasInlineError;
  }

  get tips() {
    return t(
      "Note: Please consider the container name carefully since it couldn't be changed after created."
    );
  }

  get formItems() {
    const { swiftError } = this.state;
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        isSwiftFile: true,
        maxLength: 63,
      },
      {
        name: 'isPublic',
        label: t('Public Access'),
        type: 'switch',
        tip: t(
          'A public container will allow anyone to use the objects in your container through a public URL.'
        ),
      },
      {
        name: 'versioning',
        label: t('Object Versioning'),
        type: 'switch',
        display: globalSwiftInfoStore.isVersioningSupported,
        tip: t(
          'Keep previous versions of objects when they are overwritten or deleted. Stored versions count toward usage.'
        ),
      },
      getSwiftErrorFormItem(swiftError),
    ];
  }

  onSubmit = async (value) => {
    const { versioning, ...rest } = value;
    const data = {
      ...rest,
      versioning: globalSwiftInfoStore.isVersioningSupported && !!versioning,
    };
    this.hasInlineError = false;
    this.setState({ swiftError: null });
    try {
      return await globalContainerStore.create(data);
    } catch (error) {
      this.hasInlineError = true;
      this.setState({ swiftError: getSwiftErrorBody(error) });
      throw error;
    }
  };
}

export default inject('rootStore')(observer(Create));
