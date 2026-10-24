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
import { L7PolicyStore } from 'stores/octavia/l7policy';
import {
  provisioningStatusCodes,
  operatingStatusCodes,
} from 'resources/octavia/lb';
import { actionConfigs, adminActions } from './Actions';
import { actionLabels, isPending, supportsL7Policies } from './helpers';

export class L7Policies extends Base {
  init() {
    this.store = new L7PolicyStore();
    this.downloadStore = new L7PolicyStore();
  }

  get policy() {
    return 'os_load-balancer_api:l7policy:get_all';
  }

  get name() {
    return t('L7 Policies');
  }

  get defaultSortKey() {
    return 'position';
  }

  get defaultSortOrder() {
    return 'ascend';
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

  updateFetchParams = ({ id, loadBalancerId, ...rest }) => ({
    ...rest,
    listener_id: this.props.detail?.id,
  });

  updateHintsByData() {
    this.infoMessage = supportsL7Policies(this.props.detail)
      ? ''
      : t(
          'L7 policies require an HTTP or TERMINATED_HTTPS listener and a provider that supports L7 policies.'
        );
    // Keep polling the parent even after the last policy has disappeared.
    const { detail = {} } = this.props;
    if (isPending(detail) || isPending(detail.loadBalancer)) {
      this.setRefreshDataTimerTransition();
    }
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('lbL7PolicyDetail'),
      routeParamsFunc: (data) => ({
        loadBalancerId: this.params.loadBalancerId,
        listenerId: this.props.detail?.id,
        id: data.id,
      }),
    },
    { title: t('Position'), dataIndex: 'position', sorter: true },
    {
      title: t('Action'),
      dataIndex: 'action',
      render: (value) => actionLabels[value] || value,
    },
    {
      title: t('Redirect URL'),
      dataIndex: 'redirect_url',
      render: (value) => value || '-',
    },
    {
      title: t('Redirect Pool ID'),
      dataIndex: 'redirect_pool_id',
      render: (value) => value || '-',
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
    { title: t('Description'), dataIndex: 'description', isHideable: true },
  ];

  get searchFilters() {
    return [{ label: t('Name'), name: 'name' }];
  }
}

export default inject('rootStore')(observer(L7Policies));
