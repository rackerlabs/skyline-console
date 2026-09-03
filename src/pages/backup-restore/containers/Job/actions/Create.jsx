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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalFreezerJobStore from 'stores/freezer/job';
import globalFreezerClientStore from 'stores/freezer/client';
import globalContainerStore from 'stores/swift/container';

class Create extends ModalAction {
  static id = 'create-job';

  static title = t('Create Job');

  static buttonText = t('Create Job');

  static policy = 'freezer:job:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalFreezerJobStore;
    this.clientStore = globalFreezerClientStore;
    this.containerStore = globalContainerStore;
    this.state = {
      ...this.state,
      clients: [],
      containers: [],
      selectedMode: 'fs',
      selectedAction: 'backup',
      selectedStorage: undefined,
    };
    this.getClients();
    this.getContainers();
  }

  async getClients() {
    await this.clientStore.fetchList();
    const clients = (this.clientStore.list.data || []).map((c) => ({
      label: c.hostname || c.client_id,
      value: c.client_id,
    }));
    this.setState({ clients });
  }

  async getContainers() {
    try {
      await this.containerStore.fetchList();
      const containers = (this.containerStore.list.data || []).map((c) => ({
        label: c.name,
        value: c.name,
      }));
      this.setState({ containers });
    } catch (e) {
      this.setState({ containers: [] });
    }
  }

  get name() {
    return t('Create Job');
  }

  get actionOptions() {
    return [
      { label: t('Backup'), value: 'backup' },
      { label: t('Restore'), value: 'restore' },
    ];
  }

  get storageOptions() {
    return [
      { label: t('Local (VM disk)'), value: 'local' },
      { label: t('Swift (Object Store)'), value: 'swift' },
      { label: t('SSH'), value: 'ssh' },
      { label: t('S3'), value: 's3' },
    ];
  }

  get modeOptions() {
    return [
      { label: t('File System (fs)'), value: 'fs' },
      { label: t('Nova VM Snapshot'), value: 'nova' },
      { label: t('Cinder Volume'), value: 'cinder' },
      { label: t('MySQL'), value: 'mysql' },
      { label: t('MongoDB (LVM)'), value: 'mongo' },
    ];
  }

  get formItems() {
    const {
      clients = [],
      selectedMode,
      selectedStorage,
      containers = [],
    } = this.state;

    const modeFields = [];
    if (selectedMode === 'nova') {
      modeFields.push({
        name: 'nova_inst_id',
        label: t('Nova Instance UUID'),
        type: 'input',
        tip: t(
          'UUID of the VM to snapshot (not the client VM — the target VM).'
        ),
        placeholder: t('e.g. 7ee5959f-0039-4f5f-b953-25ef38b1a88e'),
      });
    } else if (selectedMode === 'cinder') {
      modeFields.push({
        name: 'cinder_vol_id',
        label: t('Cinder Volume UUID'),
        type: 'input',
        tip: t('UUID of the Cinder volume to back up.'),
        placeholder: t('e.g. 2453735e-678a-4b4a-8604-b79b55c2cd21'),
      });
    } else if (selectedMode === 'mysql') {
      modeFields.push({
        name: 'mysql_conf',
        label: t('MySQL Config File'),
        type: 'input',
        tip: t('Path to MySQL backup .cnf file on the VM.'),
        placeholder: t('/etc/mysql/conf.d/backup.cnf'),
      });
      modeFields.push({
        name: 'path_to_backup',
        label: t('Temp Backup Path'),
        type: 'input',
        tip: t('Temporary local path for MySQL dump before upload.'),
        placeholder: t('/tmp/mysql-backup'),
      });
    } else if (selectedMode === 'mongo') {
      modeFields.push({
        name: 'lvm_srcvol',
        label: t('LVM Source Volume'),
        type: 'input',
        placeholder: t('/dev/mongo/mongo-1'),
      });
      modeFields.push({
        name: 'lvm_volgroup',
        label: t('LVM Volume Group'),
        type: 'input',
        placeholder: t('mongo'),
      });
      modeFields.push({
        name: 'lvm_snapsize',
        label: t('LVM Snapshot Size'),
        type: 'input',
        placeholder: t('2G'),
      });
      modeFields.push({
        name: 'path_to_backup',
        label: t('LVM Mount Path'),
        type: 'input',
        placeholder: t('/tmp/lvm-snapshot-backup'),
      });
    } else {
      modeFields.push({
        name: 'path_to_backup',
        label: t('Path to Backup'),
        type: 'input',
        required: true,
        tip: t('Directory or file path on the VM to back up.'),
        placeholder: t('/home/ubuntu/data'),
      });
    }

    return [
      {
        name: 'description',
        label: t('Job Name'),
        type: 'input',
        required: true,
        placeholder: t('e.g. daily-fs-backup'),
      },
      {
        name: 'client_id',
        label: t('Client (VM)'),
        type: 'select',
        options: clients,
        required: true,
        placeholder: t('Select a registered VM'),
        tip: t('The VM whose freezer-scheduler will execute this job.'),
      },

      {
        name: 'backup_name',
        label: t('Backup Name'),
        type: 'input',
        required: true,
        placeholder: t('e.g. my-fs-backup'),
        tip: t('Unique name for this backup set.'),
      },
      {
        name: 'action',
        label: t('Action Type'),
        type: 'select',
        options: this.actionOptions,
        required: true,
        onChange: (val) => this.setState({ selectedAction: val }),
      },
      {
        name: 'mode',
        label: t('Backup Mode'),
        type: 'select',
        options: this.modeOptions,
        required: true,
        onChange: (val) => this.setState({ selectedMode: val }),
        tip: t(
          'fs=files, nova=VM snapshot, cinder=volume, mysql/mongo=databases'
        ),
      },
      ...modeFields,
      {
        name: 'storage',
        label: t('Storage Backend'),
        type: 'select',
        options: this.storageOptions,
        required: true,
        onChange: (val) => this.setState({ selectedStorage: val }),
        tip: t(
          'local: stored on the VM disk. swift: uploaded to OpenStack object store.'
        ),
      },
      selectedStorage === 'swift'
        ? {
            name: 'container',
            label: t('Container'),
            type: 'select',
            options: containers,
            required: true,
            showSearch: true,
            allowClear: true,
            placeholder: t('Select a Swift container in this project'),
            tip: t(
              'Swift containers in your current project. To back up to a new ' +
                'container, create it first under Object Storage.'
            ),
          }
        : {
            name: 'container',
            label: t('Container / Path'),
            type: 'input',
            required: true,
            tip: t(
              'For local: absolute path on VM (e.g. /tmp/backups). ' +
                'For swift: Swift container name (e.g. my-backups).'
            ),
            placeholder: t('/tmp/freezer-backups  or  my-swift-container'),
          },

      {
        name: 'schedule_start_date',
        label: t('Schedule Start Date'),
        type: 'date-picker',
        showTime: true,
        tip: t(
          'When to start running this job (optional — runs immediately if blank).'
        ),
      },
      {
        name: 'schedule_interval',
        label: t('Schedule Interval'),
        type: 'input',
        placeholder: t('e.g. 24 hours, 7 days, 1 weeks'),
        tip: t('How often to repeat. Leave blank for a one-time job.'),
      },
      {
        name: 'schedule_end_date',
        label: t('Schedule End Date'),
        type: 'date-picker',
        showTime: true,
        tip: t('When to stop repeating (optional).'),
      },

      {
        name: 'max_retries',
        label: t('Max Retries'),
        type: 'input-number',
        min: 0,
        tip: t('How many times to retry on failure (default 0).'),
      },
    ];
  }

  onSubmit = (values) => {
    const {
      description,
      client_id,
      backup_name,
      action,
      mode,
      path_to_backup,
      nova_inst_id,
      cinder_vol_id,
      mysql_conf,
      lvm_srcvol,
      lvm_volgroup,
      lvm_snapsize,
      storage,
      container,
      schedule_start_date,
      schedule_interval,
      schedule_end_date,
      max_retries,
    } = values;

    const freezer_action = {
      action,
      backup_name: (backup_name || '').replace(/ /g, '_'),
      storage,
      container,
      mode,
      log_file: `/var/log/freezer/${(backup_name || 'job').replace(
        / /g,
        '_'
      )}.log`,
    };

    // Keys must use oslo_config dest names (e.g. engine_name, not engine),
    // otherwise freezer's config parser crashes.
    if (path_to_backup) freezer_action.path_to_backup = path_to_backup;
    if (nova_inst_id) {
      freezer_action.nova_inst_id = nova_inst_id;
    }
    if (cinder_vol_id) freezer_action.cinder_vol_id = cinder_vol_id;
    if (mysql_conf) freezer_action.mysql_conf = mysql_conf;
    if (lvm_srcvol) {
      freezer_action.lvm_srcvol = lvm_srcvol;
      freezer_action.lvm_volgroup = lvm_volgroup;
      freezer_action.lvm_snapsize = lvm_snapsize || '2G';
      // NOTE: oslo dest is 'lvm_snapperm' (no underscore between snap/perm)
      freezer_action.lvm_snapperm = 'ro';
      freezer_action.lvm_dirmount =
        path_to_backup || '/tmp/lvm-snapshot-backup';
    }
    // Must be 'engine_name' (oslo dest), not 'engine'.
    if (mode === 'nova') freezer_action.engine_name = 'nova';

    const job_action_entry = { freezer_action, max_retries: max_retries || 0 };

    const job_schedule = {};
    if (schedule_start_date) {
      // Freezer expects "YYYY-MM-DDTHH:mm:ss" (no fractional seconds, no Z).
      job_schedule.schedule_start_date =
        typeof schedule_start_date === 'string'
          ? schedule_start_date.replace(/\.\d+Z?$/, '').replace(/Z$/, '')
          : schedule_start_date.format
          ? schedule_start_date.utc().format('YYYY-MM-DDTHH:mm:ss')
          : String(schedule_start_date);
    }
    if (schedule_interval) {
      job_schedule.schedule_interval = schedule_interval;
      job_schedule.status = 'scheduled';
      job_schedule.event = 'start';
    }
    if (schedule_end_date) {
      job_schedule.schedule_end_date =
        typeof schedule_end_date === 'string'
          ? schedule_end_date.replace(/\.\d+Z?$/, '').replace(/Z$/, '')
          : schedule_end_date.format
          ? schedule_end_date.utc().format('YYYY-MM-DDTHH:mm:ss')
          : String(schedule_end_date);
    }

    const body = {
      description,
      client_id,
      job_actions: [job_action_entry],
      job_schedule,
    };

    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(Create));
