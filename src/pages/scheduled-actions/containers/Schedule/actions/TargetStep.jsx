import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import { ExecutionProfileStore } from 'stores/qonos/execution-profile';
import { ServerStore } from 'stores/nova/instance';
import { instanceSelectTablePropsBackend } from 'resources/nova/instance';

export class TargetStep extends Base {
  init() {
    this.profileStore = new ExecutionProfileStore();
    this.serverStore = new ServerStore();
    this.profileStore.fetchList();
  }

  get name() {
    return t('Schedule target config');
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  get profileColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Trust ID'),
        dataIndex: 'trust_id',
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        valueRender: 'yesNo',
      },
    ];
  }

  get formItems() {
    return [
      {
        name: 'server',
        label: t('Instance'),
        type: 'select-table',
        backendPageStore: this.serverStore,
        backendPageFunc: 'fetchListByPage',
        rowKey: 'id',
        required: true,
        selectedLabel: t('Instance'),
        ...instanceSelectTablePropsBackend,
      },
      {
        name: 'execution_profile',
        label: t('Execution Profile'),
        type: 'select-table',
        data: this.profileStore.list.data,
        isLoading: this.profileStore.list.isLoading,
        columns: this.profileColumns,
        filterParams: [{ label: t('Name'), name: 'name' }],
        disabledFunc: (record) => !record.enabled,
        required: true,
        selectedLabel: t('Execution Profile'),
      },
    ];
  }
}

export default inject('rootStore')(observer(TargetStep));
