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
import Base from 'containers/TabDetail';
import globalFreezerJobStore from 'stores/freezer/job';
import { freezerJobStatus, freezerJobResult } from 'resources/freezer/job';
import BaseDetail from './BaseDetail';
import actionConfigs from '../actions';

export class FreezerJobDetail extends Base {
  init() {
    this.store = globalFreezerJobStore;
  }

  get name() {
    return t('Job Detail');
  }

  get policy() {
    return 'freezer:job:get';
  }

  get listUrl() {
    return this.getRoutePath('freezerJob');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'description',
      },
      {
        title: t('Job ID'),
        dataIndex: 'job_id',
      },
      {
        title: t('Client'),
        dataIndex: 'client_id',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: freezerJobStatus,
      },
      {
        title: t('Result'),
        dataIndex: 'result',
        valueMap: freezerJobResult,
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('Detail'),
        key: 'base',
        component: BaseDetail,
      },
    ];
  }
}

export default inject('rootStore')(observer(FreezerJobDetail));
