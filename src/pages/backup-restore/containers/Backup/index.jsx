import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalFreezerBackupStore from 'stores/freezer/backup';
import actionConfigs from './actions';

export class FreezerBackups extends Base {
  init() {
    this.store = globalFreezerBackupStore;
  }

  get name() {
    return t('Backups');
  }

  get policy() {
    return 'freezer:backup:list';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Backup Name'),
      dataIndex: 'backup_name',
    },
    {
      title: t('Hostname'),
      dataIndex: 'hostname',
      isHideable: true,
    },
    {
      title: t('Created At'),
      dataIndex: 'time_stamp',
      isHideable: true,
    },
    {
      title: t('Level'),
      dataIndex: 'level',
      isHideable: true,
    },
    {
      title: t('Storage'),
      dataIndex: 'storage',
      isHideable: true,
    },
    {
      title: t('Encrypted'),
      dataIndex: 'encrypted',
      isHideable: true,
      render: (value) => (value ? t('Yes') : t('No')),
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'backup_name',
      },
    ];
  }
}

export default inject('rootStore')(observer(FreezerBackups));
