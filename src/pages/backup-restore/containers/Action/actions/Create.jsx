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
import globalFreezerActionStore from 'stores/freezer/action';

class Create extends ModalAction {
  static id = 'create-action';

  static title = t('Create Action');

  static buttonText = t('Create Action');

  static policy = 'freezer:action:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalFreezerActionStore;
  }

  get name() {
    return t('Create Action');
  }

  get actionOptions() {
    return [
      { label: t('Backup'), value: 'backup' },
      { label: t('Restore'), value: 'restore' },
      { label: t('Admin'), value: 'admin' },
    ];
  }

  get storageOptions() {
    return [
      { label: t('Local'), value: 'local' },
      { label: t('Swift'), value: 'swift' },
      { label: t('SSH'), value: 'ssh' },
      { label: t('S3'), value: 's3' },
    ];
  }

  get modeOptions() {
    return [
      { label: t('File System'), value: 'fs' },
      { label: t('MySQL'), value: 'mysql' },
      { label: t('MongoDB'), value: 'mongo' },
      { label: t('SQL Server'), value: 'sqlserver' },
    ];
  }

  get formItems() {
    return [
      {
        name: 'backup_name',
        label: t('Action Name'),
        type: 'input',
        required: true,
        placeholder: t('Please input action name'),
      },
      {
        name: 'action',
        label: t('Action Type'),
        type: 'select',
        options: this.actionOptions,
        required: true,
      },
      {
        name: 'path_to_backup',
        label: t('Path to Backup/Restore'),
        type: 'input',
        required: true,
        placeholder: t('e.g. /var/lib/data'),
      },
      {
        name: 'storage',
        label: t('Storage'),
        type: 'select',
        options: this.storageOptions,
      },
      {
        name: 'container',
        label: t('Container'),
        type: 'input',
        tip: t('Storage container/bucket for the backup'),
      },
      {
        name: 'mode',
        label: t('Mode'),
        type: 'select',
        options: this.modeOptions,
      },
      {
        name: 'max_retries',
        label: t('Max Retries'),
        type: 'input-number',
        min: 0,
      },
      {
        name: 'max_retries_interval',
        label: t('Max Retries Interval (seconds)'),
        type: 'input-number',
        min: 0,
      },
    ];
  }

  onSubmit = (values) => {
    const {
      backup_name,
      action,
      path_to_backup,
      storage,
      container,
      mode,
      max_retries,
      max_retries_interval,
    } = values;
    const body = {
      freezer_action: {
        action,
        backup_name: backup_name.replace(/ /g, '_'),
        path_to_backup,
        storage: storage || undefined,
        container: container || undefined,
        mode: mode || undefined,
      },
    };
    if (max_retries !== undefined && max_retries !== '') {
      body.max_retries = max_retries;
    }
    if (max_retries_interval !== undefined && max_retries_interval !== '') {
      body.max_retries_interval = max_retries_interval;
    }
    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(Create));
