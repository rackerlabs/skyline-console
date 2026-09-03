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
import globalFreezerJobStore from 'stores/freezer/job';
import { freezerJobStatus, freezerJobResult } from 'resources/freezer/job';
import actionConfigs from './actions';

export class FreezerJobs extends Base {
  init() {
    this.store = globalFreezerJobStore;
  }

  get name() {
    return t('Backup Jobs');
  }

  get policy() {
    return 'freezer:job:list';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('freezerJobDetail'),
    },
    {
      title: t('Client'),
      dataIndex: 'client_id',
      isHideable: true,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      isHideable: true,
      valueMap: freezerJobStatus,
    },
    {
      title: t('Result'),
      dataIndex: 'result',
      isHideable: true,
      valueMap: freezerJobResult,
    },
    {
      title: t('Actions'),
      dataIndex: 'actions_count',
      isHideable: true,
      sorter: false,
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(FreezerJobs));
