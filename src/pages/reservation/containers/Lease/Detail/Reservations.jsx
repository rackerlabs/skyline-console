import React from 'react';
import { Typography } from 'antd';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalReservationStore from 'stores/blazar/reservation';
import { formatReservationType, statusMap } from 'resources/blazar/reservation';

const { Paragraph } = Typography;

const renderTextBlock = (value) => {
  if (!value) {
    return '-';
  }
  return (
    <Paragraph style={{ marginBottom: 0 }} copyable>
      {typeof value === 'string' ? value : JSON.stringify(value)}
    </Paragraph>
  );
};

const renderAmount = (value, record) => {
  if (record.resource_type === 'physical:host') {
    return `${record.min || '-'} / ${record.max || '-'}`;
  }
  return record.amount || '-';
};

export class Reservations extends Base {
  init() {
    this.store = globalReservationStore;
  }

  get policy() {
    return 'osreservations:leases:get';
  }

  get name() {
    return t('reservations');
  }

  get hideSearch() {
    return true;
  }

  get hideDownload() {
    return true;
  }

  getColumns = () => [
    {
      title: t('ID'),
      dataIndex: 'id',
    },
    {
      title: t('Type'),
      dataIndex: 'resource_type',
      render: formatReservationType,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      valueMap: statusMap,
    },
    {
      title: t('Amount Min/Max'),
      dataIndex: 'amount',
      render: renderAmount,
    },
    {
      title: t('Resource ID'),
      dataIndex: 'resource_id',
      isHideable: true,
    },
    {
      title: t('Flavor ID'),
      dataIndex: 'flavor_id',
      isHideable: true,
    },
    {
      title: t('Network ID'),
      dataIndex: 'network_id',
      isHideable: true,
    },
    {
      title: t('Required Floating IPs'),
      dataIndex: 'required_floatingips',
      isHideable: true,
      render: (value) => (value && value.length ? value.join(', ') : '-'),
    },
    {
      title: t('Hypervisor Properties'),
      dataIndex: 'hypervisor_properties',
      isHideable: true,
      render: renderTextBlock,
    },
    {
      title: t('Resource Properties'),
      dataIndex: 'resource_properties',
      isHideable: true,
      render: renderTextBlock,
    },
    {
      title: t('Before End Action'),
      dataIndex: 'before_end',
      isHideable: true,
    },
    {
      title: t('Missing Resources'),
      dataIndex: 'missing_resources',
      valueRender: 'yesNo',
      isHideable: true,
    },
    {
      title: t('Resources Changed'),
      dataIndex: 'resources_changed',
      valueRender: 'yesNo',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Reservations));
