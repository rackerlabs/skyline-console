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
import Base from 'containers/List';
import { L7RuleStore } from 'stores/octavia/l7rule';
import {
  provisioningStatusCodes,
  operatingStatusCodes,
} from 'resources/octavia/lb';
import { isPending } from '../../helpers';
import { actionConfigs, adminActions } from './Actions';

export class L7Rules extends Base {
  init() {
    this.store = new L7RuleStore();
    this.downloadStore = new L7RuleStore();
  }

  get policy() {
    return 'os_load-balancer_api:l7rule:get_all';
  }

  get name() {
    return t('L7 Rules');
  }

  get forceRefreshTopDetailWhenListRefresh() {
    return true;
  }

  get actionConfigs() {
    return this.isAdminPage ? adminActions : actionConfigs;
  }

  get itemInTransitionFunction() {
    return isPending;
  }

  updateFetchParams = ({ id, listenerId, loadBalancerId, ...rest }) => ({
    ...rest,
    l7policy_id: this.props.detail?.id,
  });

  updateHintsByData() {
    const { detail = {} } = this.props;
    if (
      [detail, detail.listener, detail.listener?.loadBalancer].some((item) =>
        isPending(item)
      )
    ) {
      this.setRefreshDataTimerTransition();
    }
  }

  getColumns = () => [
    { title: t('ID'), dataIndex: 'id', copyable: true },
    { title: t('Rule Type'), dataIndex: 'type' },
    { title: t('Compare Type'), dataIndex: 'compare_type' },
    { title: t('Key'), dataIndex: 'key', render: (value) => value || '-' },
    { title: t('Value'), dataIndex: 'value' },
    {
      title: t('Invert'),
      dataIndex: 'invert',
      render: (value) => (value ? t('Yes') : t('No')),
    },
    {
      title: t('Admin State Up'),
      dataIndex: 'admin_state_up',
      render: (value) => (value ? t('On') : t('Off')),
    },
    {
      title: t('Provisioning Status'),
      dataIndex: 'provisioning_status',
      valueMap: provisioningStatusCodes,
    },
    {
      title: t('Operating Status'),
      dataIndex: 'operating_status',
      valueMap: operatingStatusCodes,
    },
  ];

  get searchFilters() {
    return [
      { label: t('Rule Type'), name: 'type' },
      { label: t('Value'), name: 'value' },
    ];
  }
}
export default inject('rootStore')(observer(L7Rules));
