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
import Base from 'containers/TabDetail';
import { L7PolicyDetailStore } from 'stores/octavia/l7policy-detail';
import {
  provisioningStatusCodes,
  operatingStatusCodes,
} from 'resources/octavia/lb';
import { actionLabels } from '../helpers';
import Rules from './Rule';

export class L7PolicyDetail extends Base {
  init() {
    this.store = new L7PolicyDetailStore();
  }

  get name() {
    return t('L7 Policy');
  }

  get policy() {
    return 'os_load-balancer_api:l7policy:get_one';
  }

  get listUrl() {
    const { listenerId, loadBalancerId } = this.params;
    return this.getRoutePath(
      'lbListenerDetail',
      { id: listenerId, loadBalancerId },
      { tab: 'l7policies' }
    );
  }

  get detailInfos() {
    return [
      { title: t('Name'), dataIndex: 'name' },
      {
        title: t('Action'),
        dataIndex: 'action',
        render: (value) => actionLabels[value] || value,
      },
      { title: t('Position'), dataIndex: 'position' },
      { title: t('Listener ID'), dataIndex: 'listener_id' },
      { title: t('Redirect URL'), dataIndex: 'redirect_url' },
      { title: t('Redirect Pool ID'), dataIndex: 'redirect_pool_id' },
      {
        title: t('Redirect HTTP Status Code'),
        dataIndex: 'redirect_http_code',
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
      {
        title: t('Admin State Up'),
        dataIndex: 'admin_state_up',
        render: (value) => (value ? t('On') : t('Off')),
      },
      { title: t('Description'), dataIndex: 'description' },
    ];
  }

  get tabs() {
    return [{ title: t('L7 Rules'), key: 'rules', component: Rules }];
  }
}
export default inject('rootStore')(observer(L7PolicyDetail));
