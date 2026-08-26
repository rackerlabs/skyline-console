// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ConfirmAction } from 'containers/Action';
import globalServerStore from 'stores/nova/instance';
import globalRootStore from 'stores/root';
import globalFreezerEnableBackupStore from 'stores/freezer/enable-backup';

export default class DisableBackup extends ConfirmAction {
  get id() {
    return 'disable-backup';
  }

  get title() {
    return t('Disable Backup');
  }

  get buttonText() {
    return t('Disable Backup');
  }

  get actionName() {
    return t('Disable Backup');
  }

  policy = 'os_compute_api:servers:show';

  isBackupEnabled = (item) => {
    const { metadata = {} } = item || {};
    return metadata.freezer_backup_enabled === 'true';
  };

  allowedCheckFunc = (item) =>
    globalRootStore.checkEndpoint('freezer') && this.isBackupEnabled(item);

  confirmContext = (data) =>
    t(
      'Are you sure to pause backups for instance {name}? Scheduled backup jobs will be stopped. Existing backups are kept and the agent stays installed, so you can resume later by enabling backup again.',
      { name: data.name }
    );

  onSubmit = async (item) => {
    const target = item || this.item;
    const { id, name } = target;

    // client_id is the VM's instance name (set at enable time).
    await globalFreezerEnableBackupStore.disable({
      instance_id: id,
      client_id: name,
    });

    try {
      await globalServerStore.setMetadata({
        id,
        metadata: {
          freezer_backup_enabled: 'false',
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed to update freezer metadata', e);
    }
    return true;
  };
}
