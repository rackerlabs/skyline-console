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
import ImageType from 'components/ImageType';
import { instanceStatus, isIronicInstance } from 'resources/nova/instance';
import { Instance as AdvancedInstance } from 'pages/compute/containers/Instance';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode instance list. Reuses everything from the Advanced list
// (data loading, row/batch actions, filters) but exposes a slimmer set
// of columns.
export class BasicInstance extends AdvancedInstance {
  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('instanceDetail'),
        sortKey: 'display_name',
      },
      {
        title: t('Image'),
        dataIndex: 'image_os_distro',
        isHideable: true,
        render: (value, record) => (
          <ImageType type={value} title={record.image_name} />
        ),
        stringify: (_, record) => record.image_name,
        sorter: false,
        width: 120,
      },
      {
        title: t('Fixed IP'),
        dataIndex: 'fixed_addresses',
        sorter: false,
        render: (fixed_addresses) => {
          if (!fixed_addresses || !fixed_addresses.length) {
            return '-';
          }
          return fixed_addresses.map((it) => <div key={it}>{it}</div>);
        },
        stringify: (value) => (value || []).join(',') || '-',
      },
      {
        title: t('Floating IP'),
        dataIndex: 'floating_addresses',
        sorter: false,
        render: (addresses) => {
          if (!addresses || !addresses.length) {
            return '-';
          }
          return addresses.map((it) => <div key={it}>{it}</div>);
        },
        stringify: (addresses) => (addresses || []).join(',') || '-',
      },
      {
        title: t('Flavor'),
        dataIndex: 'flavor',
        sorter: false,
        render: (value, record) =>
          isIronicInstance(record)
            ? `${value}(${t('Ironic Instance')})`
            : value,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        sorter: false,
        render: (value) => instanceStatus[value && value.toLowerCase()] || '-',
      },
    ];
  }

  // Swap the primary Create action so it lands on the Basic create page.
  get actionConfigs() {
    const base = super.actionConfigs;
    return {
      ...base,
      primaryActions: [BasicCreateAction],
    };
  }

  // Keep search bar with just the useful filters.
  get searchFilters() {
    return [
      { label: t('Name'), name: 'name' },
      { label: t('ID'), name: 'uuid' },
    ];
  }

  // Hide the column-visibility eye icon in Basic — the trimmed column
  // set is fixed.
  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicInstance));
