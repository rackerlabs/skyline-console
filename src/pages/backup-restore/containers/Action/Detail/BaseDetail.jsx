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

import Base from 'containers/BaseDetail';
import { freezerStorageType, freezerModeType } from 'resources/freezer/action';

export default class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard, this.retryCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Backup Name'),
        dataIndex: 'backup_name',
      },
      {
        label: t('Path to Backup/Restore'),
        dataIndex: 'path_to_backup',
      },
      {
        label: t('Storage'),
        dataIndex: 'storage',
        valueMap: freezerStorageType,
      },
      {
        label: t('Container'),
        dataIndex: 'container',
      },
      {
        label: t('Mode'),
        dataIndex: 'mode',
        valueMap: freezerModeType,
      },
    ];
    return {
      title: t('Action Info'),
      options,
    };
  }

  get retryCard() {
    const options = [
      {
        label: t('Max Retries'),
        dataIndex: 'max_retries',
        render: (value) => (value !== undefined ? value : '-'),
      },
      {
        label: t('Max Retries Interval'),
        dataIndex: 'max_retries_interval',
        render: (value) => (value !== undefined ? value : '-'),
      },
      {
        label: t('Mandatory'),
        dataIndex: 'mandatory',
        render: (value) => (value ? t('Yes') : t('No')),
      },
    ];
    return {
      title: t('Retry Settings'),
      options,
    };
  }
}
