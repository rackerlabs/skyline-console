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
import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import PopoverSubnets from 'components/Popover/PopoverSubnets';
import { NetworkStore } from 'stores/neutron/network';
import { networkStatus } from 'resources/neutron/network';
import { yesNoOptions } from 'utils/constants';
import actionConfigs from 'pages/network/containers/Network/actions';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode network list. Everything the user can see (project,
// shared, external) rendered in a single flat list — no tabs.
// Columns: ID/Name, Is Current Project, External, Shared, Status,
// Subnet Count, Actions.
export class BasicNetwork extends Base {
  init() {
    this.store = new NetworkStore();
    this.downloadStore = new NetworkStore();
  }

  get policy() {
    return 'get_network';
  }

  get name() {
    return t('networks');
  }

  get isFilterByBackend() {
    return true;
  }

  get isSortByBackend() {
    return true;
  }

  get defaultSortKey() {
    return 'status';
  }

  get actionConfigs() {
    return {
      ...actionConfigs,
      primaryActions: [BasicCreateAction],
    };
  }

  updateFetchParamsByPage = (params) => ({ ...params });

  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('networkDetail'),
      },
      {
        title: t('Is Current Project'),
        dataIndex: 'tenant_id',
        render: (value) =>
          value === this.currentProjectId ? t('Yes') : t('No'),
        sorter: false,
      },
      {
        title: t('External'),
        dataIndex: 'router:external',
        valueRender: 'yesNo',
        sorter: false,
      },
      {
        title: t('Shared'),
        dataIndex: 'shared',
        valueRender: 'yesNo',
        sorter: false,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: networkStatus,
      },
      {
        title: t('Subnet Count'),
        dataIndex: 'subnets',
        sorter: false,
        render: (value, record) => {
          const count = (value || []).length;
          if (count === 0) {
            return count;
          }
          return <PopoverSubnets subnetIds={record.subnets} title={count} />;
        },
        stringify: (subnets) => `${subnets.length}(${subnets.join(',')})`,
      },
    ];
  }

  get searchFilters() {
    return [
      { label: t('Name'), name: 'name' },
      { label: t('ID'), name: 'id' },
      { label: t('Shared'), name: 'shared', options: yesNoOptions },
      {
        label: t('External'),
        name: 'router:external',
        options: yesNoOptions,
      },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicNetwork));
