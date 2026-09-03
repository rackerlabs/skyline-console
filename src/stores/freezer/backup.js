import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';

export class FreezerBackupStore extends Base {
  get client() {
    return client.freezer.backups;
  }

  get listResponseKey() {
    return 'backups';
  }

  // freezer-api returns only 10 items by default; request all explicitly.
  listFetchByClient(params, originParams) {
    return super.listFetchByClient({ limit: 500, ...params }, originParams);
  }

  get mapper() {
    return (data) => ({
      ...data,
      id: data.backup_id,
      name: data.backup_metadata?.backup_name || data.backup_id,
      backup_name: data.backup_metadata?.backup_name,
      hostname: data.backup_metadata?.hostname,
      time_stamp: data.backup_metadata?.time_stamp,
      level: data.backup_metadata?.curr_backup_level,
      storage: data.backup_metadata?.storage,
      path_to_backup: data.backup_metadata?.path_to_backup,
      container: data.backup_metadata?.container,
      encrypted: data.backup_metadata?.encrypted,
      mode: data.backup_metadata?.mode,
      nova_inst_id: data.backup_metadata?.nova_inst_id,
      cinder_vol_id: data.backup_metadata?.cinder_vol_id,
    });
  }

  @action
  restore(id, body) {
    // Orchestrated by skyline-apiserver; freezer-api has no restore endpoint.
    return this.submitting(
      client.skyline.request.post(
        `extension/freezer/backups/${id}/restore`,
        body
      )
    );
  }
}

const globalFreezerBackupStore = new FreezerBackupStore();
export default globalFreezerBackupStore;
