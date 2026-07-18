import React from 'react';
import { inject, observer } from 'mobx-react';
import { volumeStatus } from 'resources/cinder/volume';
import { Volume as AdvancedVolume } from 'pages/storage/containers/Volume';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode volume list. Reuses the Advanced list (data, filters,
// actions) but trims columns to: ID/Name, Size, Status, Type,
// Attached To, Actions.
export class BasicVolume extends AdvancedVolume {
  getColumns = () => {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('volumeDetail'),
        sortKey: 'name',
      },
      {
        title: t('Size'),
        dataIndex: 'size',
        unit: 'GiB',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: volumeStatus,
      },
      {
        title: t('Type'),
        dataIndex: 'volume_type',
        width: 120,
        sorter: false,
      },
      {
        title: t('Attached To'),
        dataIndex: 'attachments',
        sorter: false,
        render: (value) => {
          if (value && value.length > 0) {
            return value.map((it) => (
              <div key={it.server_id}>
                {it.device} on{' '}
                {this.getLinkRender(
                  'instanceDetail',
                  it.server_name || it.server_id,
                  { id: it.server_id },
                  { tab: 'volumes' }
                )}
              </div>
            ));
          }
          return '-';
        },
        stringify: (value) => {
          if (value && value.length) {
            return value
              .map((it) => {
                const { device, server_name, server_id } = it;
                return `${device} on ${server_name || '-'}(${server_id})`;
              })
              .join(',');
          }
          return '-';
        },
      },
    ];
  };

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

export default inject('rootStore')(observer(BasicVolume));
