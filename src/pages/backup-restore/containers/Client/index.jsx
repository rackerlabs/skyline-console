import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalFreezerClientStore from 'stores/freezer/client';
import actionConfigs from './actions';

export class FreezerClients extends Base {
  init() {
    this.store = globalFreezerClientStore;
  }

  get name() {
    return t('Clients');
  }

  get policy() {
    return 'freezer:client:list';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Client ID'),
      dataIndex: 'client_id',
    },
    {
      title: t('Hostname'),
      dataIndex: 'hostname',
    },
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      isHideable: true,
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Hostname'),
        name: 'hostname',
      },
    ];
  }
}

export default inject('rootStore')(observer(FreezerClients));
