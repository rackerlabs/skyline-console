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
import { SecurityGroups as AdvancedSecurityGroups } from 'pages/network/containers/SecurityGroup';
import actionConfigs from 'pages/network/containers/SecurityGroup/actions';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode security group list. Reuses Advanced list; trims columns
// to: ID/Name, Description, Created At, Actions.
export class BasicSecurityGroups extends AdvancedSecurityGroups {
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
      routeName: this.getRouteName('securityGroupDetail'),
    },
    {
      title: t('Description'),
      dataIndex: 'description',
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'sinceTime',
    },
  ];

  get searchFilters() {
    return [
      { label: t('ID'), name: 'id' },
      { label: t('Name'), name: 'name' },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicSecurityGroups));
