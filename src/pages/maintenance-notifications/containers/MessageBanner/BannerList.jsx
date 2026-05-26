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
import { observer, inject } from 'mobx-react';
import { Tag } from 'antd';
import Base from 'containers/List';
import globalMessageBannerStore from 'stores/skyline/message-banner';
import { onlyAdminCanReadPolicy } from 'resources/skyline/policy';
import {
  enabledOptions,
  formatUtcTime,
  getMessageSourceLabel,
  getMessageTypeLabel,
  sourceOptions,
} from 'resources/skyline/message-banner';
import { maintenanceActionConfigs, notificationActionConfigs } from './actions';
import styles from './index.less';

export class BannerList extends Base {
  init() {
    this.store = globalMessageBannerStore;
  }

  get policy() {
    return onlyAdminCanReadPolicy;
  }

  get name() {
    return t('Message Banner');
  }

  get rowKey() {
    return 'id';
  }

  get hideDownload() {
    return true;
  }

  get actionConfigs() {
    const { tab } = this.props;
    return tab === 'notification'
      ? notificationActionConfigs
      : maintenanceActionConfigs;
  }

  renderType = (type) => {
    const color = type === 'maintenance' ? 'orange' : 'blue';
    return <Tag color={color}>{getMessageTypeLabel(type)}</Tag>;
  };

  renderSource = (source) => {
    const color = source === 'manual' ? 'green' : 'purple';
    return <Tag color={color}>{getMessageSourceLabel(source)}</Tag>;
  };

  renderEnabled = (enabled, record) => {
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    const isExpired = expiresAt <= now;
    const isDisabledByAdmin = !enabled && !isExpired;

    if (isDisabledByAdmin) {
      return (
        <span>
          <Tag color="red">{t('Inactive')}</Tag>
          <Tag color="orange">{t('Disabled')}</Tag>
        </span>
      );
    }
    if (isExpired || !enabled) {
      return <Tag color="default">{t('Inactive')}</Tag>;
    }
    return <Tag color="green">{t('Active')}</Tag>;
  };

  renderMessage = (message) => (
    <div className={styles.message}>{message || '-'}</div>
  );

  getColumns() {
    const { tab } = this.props;
    const isMaintenance = tab !== 'notification';
    const columns = [
      {
        title: t('Title'),
        dataIndex: 'title',
        width: 200,
        render: (value) => value || '-',
      },
      {
        title: t('Message'),
        dataIndex: 'message',
        width: 400,
        render: this.renderMessage,
      },
    ];
    if (isMaintenance) {
      columns.push({
        title: t('Start_Time'),
        dataIndex: 'start_at',
        width: 160,
        render: formatUtcTime,
      });
    }
    columns.push(
      {
        title: t('End_Time'),
        dataIndex: 'expires_at',
        width: 160,
        render: formatUtcTime,
      },
      {
        title: t('Source'),
        dataIndex: 'source',
        width: 90,
        render: this.renderSource,
      },
      {
        title: t('Status'),
        dataIndex: 'enabled',
        width: 90,
        render: this.renderEnabled,
      }
    );
    return columns;
  }

  get searchFilters() {
    return [
      {
        label: t('Title'),
        name: 'title',
      },
      {
        label: t('Message'),
        name: 'message',
      },
      {
        label: t('Region'),
        name: 'region',
      },
      {
        label: t('Source'),
        name: 'source',
        options: sourceOptions,
      },
      {
        label: t('Status'),
        name: 'enabled',
        options: enabledOptions,
      },
    ];
  }
}

export default inject('rootStore')(observer(BannerList));
