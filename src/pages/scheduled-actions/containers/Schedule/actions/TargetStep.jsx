import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import { ExecutionProfileStore } from 'stores/qonos/execution-profile';
import { ServerStore } from 'stores/nova/instance';
import { VolumeStore } from 'stores/cinder/volume';
import { instanceSelectTablePropsBackend } from 'resources/nova/instance';
import { volumeSelectTablePropsBackend } from 'resources/cinder/volume';
import {
  ACTION_TYPES,
  executionProfileColumns,
  isServerSnapshotAction,
  isVolumeBackupAction,
} from 'resources/qonos';

export class TargetStep extends Base {
  init() {
    this.profileStore = new ExecutionProfileStore();
    this.serverStore = new ServerStore();
    this.volumeStore = new VolumeStore();
    this.profileStore.fetchList();
  }

  get name() {
    return t('Schedule target config');
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  get actionType() {
    return this.props.context?.action_type || ACTION_TYPES.SERVER_SNAPSHOT;
  }

  get formItems() {
    const showServer = isServerSnapshotAction(this.actionType);
    const showVolume = isVolumeBackupAction(this.actionType);
    return [
      {
        name: 'server',
        label: t('Instance'),
        type: 'select-table',
        backendPageStore: this.serverStore,
        backendPageFunc: 'fetchListByPage',
        rowKey: 'id',
        required: showServer,
        hidden: !showServer,
        selectedLabel: t('Instance'),
        ...instanceSelectTablePropsBackend,
      },
      {
        name: 'volume',
        label: t('Volume'),
        type: 'select-table',
        backendPageStore: this.volumeStore,
        backendPageFunc: 'fetchListByPage',
        rowKey: 'id',
        required: showVolume,
        hidden: !showVolume,
        selectedLabel: t('Volume'),
        ...volumeSelectTablePropsBackend,
      },
      {
        name: 'execution_profile',
        label: t('Execution Profile'),
        type: 'select-table',
        data: this.profileStore.list.data,
        isLoading: this.profileStore.list.isLoading,
        columns: executionProfileColumns,
        filterParams: [{ label: t('Name'), name: 'name' }],
        disabledFunc: (record) => !record.enabled,
        required: true,
        selectedLabel: t('Execution Profile'),
      },
    ];
  }
}

export default inject('rootStore')(observer(TargetStep));
