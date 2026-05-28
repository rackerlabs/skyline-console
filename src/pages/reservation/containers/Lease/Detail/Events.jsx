import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalEventStore from 'stores/blazar/event';
import { statusMap } from 'resources/blazar/reservation';

export class Events extends Base {
  init() {
    this.store = globalEventStore;
  }

  get policy() {
    return 'osreservations:leases:get';
  }

  get name() {
    return t('events');
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
      title: t('Event Type'),
      dataIndex: 'event_type',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      valueMap: statusMap,
    },
    {
      title: t('Time'),
      dataIndex: 'time',
      valueRender: 'toLocalTime',
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
    {
      title: t('Updated At'),
      dataIndex: 'updated_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Events));
