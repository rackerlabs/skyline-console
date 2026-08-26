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

import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalFreezerActionStore from 'stores/freezer/action';
import {
  freezerActionType,
  freezerStorageType,
  freezerModeType,
} from 'resources/freezer/action';
import actionConfigs from './actions';

export class FreezerActions extends Base {
  init() {
    this.store = globalFreezerActionStore;
  }

  get name() {
    return t('Actions');
  }

  get policy() {
    return 'freezer:action:list';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Action Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('freezerActionDetail'),
    },
    {
      title: t('Action Type'),
      dataIndex: 'action_type',
      isHideable: true,
      valueMap: freezerActionType,
    },
    {
      title: t('Path to Backup/Restore'),
      dataIndex: 'path_to_backup',
      isHideable: true,
    },
    {
      title: t('Storage'),
      dataIndex: 'storage',
      isHideable: true,
      valueMap: freezerStorageType,
    },
    {
      title: t('Mode'),
      dataIndex: 'mode',
      isHideable: true,
      valueMap: freezerModeType,
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Action Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(FreezerActions));
