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

// Post-creation "Enable Backup" resumes a paused VM's jobs (password-less).
// Shown only when the agent is already installed and backups are paused.
export default class EnableBackup extends ConfirmAction {
  get id() {
    return 'enable-backup';
  }

  get title() {
    return t('Enable Backup');
  }

  get buttonText() {
    return t('Enable Backup');
  }

  get actionName() {
    return t('Enable Backup');
  }

  policy = 'os_compute_api:servers:show';

  isAgentInstalled = (item) => {
    const { metadata = {} } = item || {};
    return metadata.freezer_agent_installed === 'true';
  };

  isBackupEnabled = (item) => {
    const { metadata = {} } = item || {};
    return metadata.freezer_backup_enabled === 'true';
  };

  allowedCheckFunc = (item) =>
    globalRootStore.checkEndpoint('freezer') &&
    this.isAgentInstalled(item) &&
    !this.isBackupEnabled(item);

  confirmContext = (data) =>
    t(
      'Resume backups for instance {name}? Its scheduled backup jobs will be restarted. No password is required.',
      { name: data.name }
    );

  onSubmit = async (item) => {
    const target = item || this.item;
    const { id, name } = target;

    await globalFreezerEnableBackupStore.resume({
      instance_id: id,
      client_id: name,
    });

    try {
      await globalServerStore.setMetadata({
        id,
        metadata: {
          freezer_backup_enabled: 'true',
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed to update freezer metadata', e);
    }
    return true;
  };
}
