// Copyright 2024 99cloud
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

import { observer, inject } from 'mobx-react';
import BaseList from 'containers/List';
import globalSecretsStore from 'stores/barbican/secrets';
import actionConfigs from './actions';

export class SecretList extends BaseList {
  init() {
    this.store = globalSecretsStore;
  }

  get name() {
    return t('Secrets');
  }

  get policy() {
    return 'barbican:secret:get';
  }

  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('secretDetail'),
      },
      {
        title: t('Algorithm'),
        dataIndex: 'algorithm',
      },
      {
        title: t('Domain'),
        dataIndex: 'domain',
      },
      {
        title: t('Expiration'),
        dataIndex: 'expiration',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Created At'),
        dataIndex: 'created',
        valueRender: 'toLocalTime',
      },
    ];
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Algorithm'),
        name: 'algorithm',
      },
      {
        label: t('Domain'),
        name: 'domain',
      },
    ];
  }
}

export default inject('rootStore')(observer(SecretList));
