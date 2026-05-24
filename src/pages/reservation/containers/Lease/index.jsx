import React from 'react';
import { Tag } from 'antd';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalLeaseStore, { LeaseStore } from 'stores/blazar/lease';
import { blazarEndpoint } from 'client/client/constants';
import {
  formatReservationType,
  reservationTypeOptions,
  statusMap,
} from 'resources/blazar/reservation';
import actionConfigs from './actions';

export class Lease extends Base {
  init() {
    this.store = globalLeaseStore;
    this.downloadStore = new LeaseStore();
  }

  get policy() {
    return 'osreservations:leases:get';
  }

  get endpoint() {
    return blazarEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('leases');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get transitionStatusList() {
    return ['PENDING', 'pending'];
  }

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Reservation Type'),
        name: 'reservations',
        options: reservationTypeOptions,
        filterFunc: (reservations, value) =>
          (reservations || []).some((it) => it.resource_type === value),
      },
      {
        label: t('Status'),
        name: 'status',
      },
    ];
  }

  renderReservationTypes = (reservations = []) => {
    const types = Array.from(
      new Set(reservations.map((it) => it.resource_type).filter((it) => !!it))
    );
    if (!types.length) {
      return '-';
    }
    return types.map((type) => (
      <Tag key={type}>{formatReservationType(type)}</Tag>
    ));
  };

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('leaseDetail'),
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      valueMap: statusMap,
    },
    {
      title: t('Start Time'),
      dataIndex: 'start_date',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
    {
      title: t('End Time'),
      dataIndex: 'end_date',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
    {
      title: t('Reservation Types'),
      dataIndex: 'reservations',
      render: this.renderReservationTypes,
      stringify: (value, record) => record.reservation_types,
    },
    {
      title: t('Events'),
      dataIndex: 'event_count',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Lease));
