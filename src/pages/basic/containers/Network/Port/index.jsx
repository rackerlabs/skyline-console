// Copyright 2022 99cloud
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
import { Port as AdvancedPort } from 'pages/network/containers/Port';
import actionConfigs from 'pages/network/containers/Port/actions';
import { portStatus } from 'resources/neutron/port';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode port list. Reuses the Advanced list for data/actions but
// trims columns to: ID/Name, Bind Resource, Owned Network ID/Name,
// IPv4 Address, Status, Actions.
export class BasicPort extends AdvancedPort {
  get actionConfigs() {
    return {
      ...actionConfigs.actionConfigs,
      primaryActions: [BasicCreateAction],
    };
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      ...this.getPortDetailRoute(),
    },
    {
      title: t('Bind Resource'),
      dataIndex: 'server_name',
      sorter: false,
      render: this.renderResource,
      stringify: (serverName, item) => {
        const { device_id, device_owner } = item;
        if (device_id && device_owner === 'compute:nova' && serverName) {
          return `${device_owner} \n ${device_id} (${serverName})`;
        }
        return `${device_owner || ''} ${device_id || '-'}`;
      },
    },
    {
      title: t('Owned Network ID/Name'),
      dataIndex: 'network_name',
      isLink: true,
      routeName: this.getRouteName('networkDetail'),
      idKey: 'network_id',
      sorter: false,
    },
    {
      title: t('IPv4 Address'),
      dataIndex: 'ipv4',
      sorter: false,
      render: (value) => value.map((it) => <div key={it}>{it}</div>),
      stringify: (value) => value.join(','),
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      valueMap: portStatus,
    },
  ];

  get searchFilters() {
    return [
      { label: t('Name'), name: 'name' },
      { label: t('ID'), name: 'uuid' },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicPort));
