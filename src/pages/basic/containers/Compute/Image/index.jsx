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
import {
  imageStatus,
  imageVisibility,
  imageUsage,
  imageFormats,
} from 'resources/glance/image';
import { Image as AdvancedImage } from 'pages/compute/containers/Image/Image';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode image list. Reuses the Advanced list (data, filters, row
// actions) but trims columns to: ID/Name, Use Type, Type, Status,
// Visibility, Disk Format, Actions.
export class BasicImage extends AdvancedImage {
  // Skip the tab wrapper — Basic just shows the project's images.
  get hasTab() {
    return false;
  }

  get tab() {
    return 'project';
  }

  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('imageDetail'),
      },
      {
        title: t('Use Type'),
        dataIndex: 'usage_type',
        valueMap: imageUsage,
        sorter: false,
      },
      {
        title: t('Type'),
        dataIndex: 'os_distro',
        render: (value) => <ImageType type={value} title={value} />,
        width: 80,
        sorter: false,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: imageStatus,
      },
      {
        title: t('Visibility'),
        dataIndex: 'visibility',
        valueMap: imageVisibility,
        sorter: false,
      },
      {
        title: t('Disk Format'),
        dataIndex: 'disk_format',
        valueMap: imageFormats,
      },
    ];
  }

  get actionConfigs() {
    const base = super.actionConfigs;
    return {
      ...base,
      primaryActions: [BasicCreateAction],
    };
  }

  get searchFilters() {
    return [
      { label: t('Name'), name: 'name' },
      { label: t('ID'), name: 'id' },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicImage));
