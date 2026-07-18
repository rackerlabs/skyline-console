import { inject, observer } from 'mobx-react';
import { FloatingIps as AdvancedFloatingIps } from 'pages/network/containers/FloatingIp';
import actionConfigs from 'pages/network/containers/FloatingIp/actions';
import { floatingIpStatus } from 'resources/neutron/floatingip';
import BasicAllocateAction from './actions/BasicAllocateAction';

// Basic-mode floating IP list. Reuses the Advanced list (data,
// actions) but trims columns to: ID/Floating IP, Description,
// Associated Resource, Status, Actions.
export class BasicFloatingIps extends AdvancedFloatingIps {
  get actionConfigs() {
    return {
      ...actionConfigs.actionConfigs,
      primaryActions: [BasicAllocateAction],
    };
  }

  getColumns() {
    return [
      {
        title: t('ID/Floating IP'),
        dataIndex: 'floating_ip_address',
        isLink: true,
        routeName: this.getRouteName('fipDetail'),
        boldName: true,
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        render: (value) => value || '-',
        sorter: false,
      },
      {
        title: t('Associated Resource'),
        dataIndex: 'resource_name',
        sorter: false,
        render: (value, record) => this.getResourceRender(value, record),
        stringify: (value, record) => this.geResourceStringify(value, record),
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: floatingIpStatus,
      },
    ];
  }

  get searchFilters() {
    return [
      { label: t('ID'), name: 'id' },
      { label: t('Floating IP'), name: 'floating_ip_address' },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicFloatingIps));
