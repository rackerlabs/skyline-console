import React from 'react';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalFreezerBackupStore from 'stores/freezer/backup';
import globalFreezerClientStore from 'stores/freezer/client';
import globalNetworkStore from 'stores/neutron/network';

class Restore extends ModalAction {
  static id = 'restore-backup';

  static title = t('Restore Backup');

  static buttonText = t('Restore');

  static policy = 'freezer:backup:restore';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalFreezerBackupStore;
    this.clientStore = globalFreezerClientStore;
    this.networkStore = globalNetworkStore;
    this.state = {
      ...this.state,
      clients: [],
      networks: [],
    };
    this.getClients();
    if (this.backupMode === 'nova') {
      this.getNetworks();
    }
  }

  get backupMode() {
    return (this.item && this.item.mode) || 'fs';
  }

  async getClients() {
    await this.clientStore.fetchList();
    const clients = (this.clientStore.list.data || []).map((c) => ({
      label: c.hostname || c.client_id,
      value: c.client_id,
    }));
    this.setState({ clients });
  }

  async getNetworks() {
    await this.networkStore.fetchList();
    const networks = (this.networkStore.list.data || []).map((n) => ({
      label: n.name || n.id,
      value: n.id,
    }));
    this.setState({ networks });
  }

  get name() {
    return t('Restore Backup');
  }

  get formItems() {
    const { clients = [], networks = [] } = this.state;
    const mode = this.backupMode;

    const items = [
      {
        name: 'backup_name',
        label: t('Backup Name'),
        type: 'label',
      },
      {
        name: 'mode',
        label: t('Backup Type'),
        type: 'label',
      },
      {
        name: 'client',
        label: t('Restore via Client'),
        type: 'select',
        options: clients,
        required: true,
        tip: t('The freezer agent (VM) that will perform the restore.'),
      },
    ];

    if (mode === 'nova') {
      items.push({
        name: 'network_id',
        label: t('Restore to Network'),
        type: 'select',
        options: networks,
        required: true,
        tip: t(
          'The restored VM is created as a new instance attached to this network.'
        ),
      });
    } else if (mode === 'cinder') {
      items.push({
        type: 'label',
        component: (
          <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            {t(
              'The Cinder volume will be restored from this backup. No additional input required.'
            )}
          </p>
        ),
      });
    } else {
      if (this.item && this.item.path_to_backup) {
        items.push({
          name: 'origin_path',
          label: t('Origin Path'),
          type: 'label',
          tip: t(
            'The source directory this backup was taken from (recorded at backup time).'
          ),
        });
      }
      items.push({
        name: 'path',
        label: t('Restore Path'),
        type: 'input',
        required: true,
        placeholder: t('/path/to/restore'),
        tip: t(
          'Destination directory on the client VM. Defaults to the origin path (restore in place); change it to restore elsewhere.'
        ),
      });
    }

    return items;
  }

  get defaultValue() {
    return {
      backup_name: this.item.backup_name,
      mode: this.backupMode,
      origin_path: this.item.path_to_backup,
      path: this.item.path_to_backup,
    };
  }

  onSubmit = (values) => {
    const { client, path, network_id } = values;
    const body = {
      backup_id: this.item.id,
      client,
    };
    if (this.backupMode === 'nova') {
      body.network_id = network_id;
    } else if (this.backupMode !== 'cinder') {
      body.path = path;
    }
    return this.store.restore(this.item.id, body);
  };
}

export default inject('rootStore')(observer(Restore));
