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

import Base from 'containers/BaseDetail';

export default class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard, this.scheduleCard];
  }

  get rightCards() {
    return [this.actionsCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Description'),
        dataIndex: 'description',
      },
      {
        label: t('Job ID'),
        dataIndex: 'job_id',
        copyable: true,
      },
      {
        label: t('Client ID'),
        dataIndex: 'client_id',
        copyable: true,
      },
    ];
    return {
      title: t('Job Info'),
      options,
    };
  }

  get scheduleCard() {
    const options = [
      {
        label: t('Schedule Status'),
        dataIndex: 'status',
      },
      {
        label: t('Result'),
        dataIndex: 'result',
      },
      {
        label: t('Start Date'),
        dataIndex: 'job_schedule',
        render: (value) => (value && value.schedule_start_date) || '-',
      },
      {
        label: t('Interval'),
        dataIndex: 'job_schedule',
        render: (value) => (value && value.schedule_interval) || '-',
      },
      {
        label: t('End Date'),
        dataIndex: 'job_schedule',
        render: (value) => (value && value.schedule_end_date) || '-',
      },
    ];
    return {
      title: t('Schedule'),
      options,
    };
  }

  get actionsCard() {
    const jobActions = this.detailData?.job_actions || [];
    const options = jobActions.map((a, index) => ({
      label: `${t('Action')} ${index + 1}`,
      content: a.freezer_action?.action
        ? `${a.freezer_action.action} - ${a.freezer_action.backup_name || ''}`
        : a.action_id || '-',
    }));
    if (options.length === 0) {
      options.push({
        label: t('Actions'),
        content: t('No actions configured'),
      });
    }
    return {
      title: t('Job Actions'),
      options,
    };
  }
}
