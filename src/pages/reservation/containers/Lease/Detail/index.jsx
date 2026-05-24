import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { LeaseStore } from 'stores/blazar/lease';
import { toLocalTimeFilter } from 'utils/index';
import { normalizeReservations, statusMap } from 'resources/blazar/reservation';
import actionConfigs from '../actions';
import Reservations from './Reservations';
import Events from './Events';

export class LeaseDetail extends Base {
  get name() {
    return t('lease');
  }

  get policy() {
    return 'osreservations:leases:get';
  }

  get listUrl() {
    return this.getRoutePath('lease');
  }

  get actionConfigs() {
    return actionConfigs;
  }

  renderBeforeEndTime = (events = []) => {
    const beforeEndEvent = normalizeReservations(events).find((event) =>
      ['before_end_lease', 'before_end'].includes(event.event_type)
    );
    return beforeEndEvent ? toLocalTimeFilter(beforeEndEvent.time) : '-';
  };

  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: statusMap,
      },
      {
        title: t('Project ID'),
        dataIndex: 'project_id',
      },
      {
        title: t('User ID'),
        dataIndex: 'user_id',
      },
      {
        title: t('Start Time'),
        dataIndex: 'start_date',
        valueRender: 'toLocalTime',
      },
      {
        title: t('End Time'),
        dataIndex: 'end_date',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Before End Time'),
        dataIndex: 'events',
        render: this.renderBeforeEndTime,
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Updated At'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Degraded'),
        dataIndex: 'degraded',
        valueRender: 'yesNo',
      },
      {
        title: t('Trust ID'),
        dataIndex: 'trust_id',
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('Reservations'),
        key: 'reservations',
        component: Reservations,
      },
      {
        title: t('Events'),
        key: 'events',
        component: Events,
      },
    ];
  }

  init() {
    this.store = new LeaseStore();
  }
}

export default inject('rootStore')(observer(LeaseDetail));
