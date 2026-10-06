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
import { ConfirmAction } from 'containers/Action';
import { getSwiftStorageWarnings } from 'resources/swift/container';
import globalContainerStore from 'stores/swift/container';
import { allCanChangePolicy } from 'resources/skyline/policy';
import warningStyles from 'components/SwiftStorageWarning/index.less';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Container');
  }

  get name() {
    return t('Delete Container');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete container');
  }

  policy = allCanChangePolicy;

  confirmContext = (data) => {
    const message = t('Are you sure to {action} (instance: {name})?', {
      action: this.actionNameDisplay || this.title,
      name: this.getName(data),
    });
    const items = Array.isArray(data) ? data : [data];
    const warnings = [
      ...new Set(
        items.flatMap((item) =>
          getSwiftStorageWarnings(item.name || item.id, item)
        )
      ),
    ];
    if (!warnings.length) {
      return message;
    }
    return (
      <div>
        <p>{this.unescape(message)}</p>
        {warnings.map((warning) => (
          <Alert
            key={warning}
            className={warningStyles['delete-warning']}
            type="warning"
            showIcon
            message={warning}
          />
        ))}
      </div>
    );
  };

  onSubmit = ({ id }) => globalContainerStore.delete({ id });

  submitErrorMsg(data, realError) {
    if (
      realError?.response?.data &&
      typeof realError.response.data === 'string'
    ) {
      return realError.response.data;
    }
    if (realError?.message && typeof realError.message === 'string') {
      return realError.message;
    }
    return super.submitErrorMsg(data, realError);
  }
}
