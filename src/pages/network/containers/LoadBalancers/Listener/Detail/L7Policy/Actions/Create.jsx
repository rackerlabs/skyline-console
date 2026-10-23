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
import { L7PolicyStore } from 'stores/octavia/l7policy';
import { PoolStore } from 'stores/octavia/pool';
import {
  l7PolicyActions,
  l7PolicyRedirectHttpCodes,
  validateL7Policy,
} from 'resources/octavia/l7policy';
import {
  actionLabels,
  canChangePolicies,
  canChangePolicy,
  eligibleRedirectPools,
  policyPayload,
  positionError,
} from '../helpers';

export class Create extends ModalAction {
  static id = 'l7policy-create';

  static title = t('Create L7 Policy');

  static buttonText = t('Create L7 Policy');

  static policy = 'os_load-balancer_api:l7policy:post';

  static allowed = (item, containerProps = {}) =>
    Promise.resolve(canChangePolicies(containerProps.detail || item));

  get name() {
    return t('Create L7 Policy');
  }

  get isEdit() {
    return false;
  }

  get isAsyncAction() {
    return true;
  }

  get listener() {
    return this.containerProps.detail || {};
  }

  get instanceName() {
    return (
      this.values.name ||
      (this.isEdit ? this.item.name || this.item.id : t('L7 Policy'))
    );
  }

  init() {
    this.store = new L7PolicyStore();
    this.poolStore = new PoolStore();
    this.state = {
      ...this.state,
      action: this.defaultValue.action,
      pools: [],
      poolsLoading: false,
      poolsError: '',
    };
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.state.action === 'REDIRECT_TO_POOL') this.loadPools();
  }

  unMountActions() {
    this.poolsCancelled = true;
  }

  async loadPools() {
    this.setState({ poolsLoading: true, poolsError: '', pools: [] });
    try {
      const pools = await this.poolStore.pureFetchList({
        loadbalancer_id: this.listener.loadBalancer.id,
        project_id: this.listener.project_id,
      });
      if (!this.poolsCancelled)
        this.setState({
          pools: eligibleRedirectPools(pools, this.listener),
          poolsLoading: false,
        });
    } catch (error) {
      if (!this.poolsCancelled)
        this.setState({
          poolsLoading: false,
          poolsError: t(
            'Unable to load redirect pools. Reopen this dialog to retry.'
          ),
        });
    }
  }

  handleActionChange = (action) => {
    this.setState({ action });
    if (action === 'REDIRECT_TO_POOL' && !this.state.poolsLoading)
      this.loadPools();
  };

  get defaultValue() {
    return { action: 'REJECT', admin_state_up: true, redirect_http_code: 302 };
  }

  get disableSubmit() {
    return (
      this.state.action === 'REDIRECT_TO_POOL' &&
      (this.state.poolsLoading || !!this.state.poolsError)
    );
  }

  validatePool = (rule, value) => {
    if (this.state.poolsLoading)
      return Promise.reject(new Error(t('Loading redirect pools.')));
    if (this.state.poolsError)
      return Promise.reject(new Error(this.state.poolsError));
    return this.state.pools.some(({ id }) => id === value)
      ? Promise.resolve()
      : Promise.reject(new Error(t('Select an available redirect pool.')));
  };

  get formItems() {
    const { action, pools, poolsLoading, poolsError } = this.state;
    return [
      { name: 'name', label: t('Name'), type: 'input', maxLength: 255 },
      { name: 'description', label: t('Description'), type: 'textarea' },
      {
        name: 'action',
        label: t('Action'),
        type: 'select',
        required: true,
        allowClear: false,
        options: l7PolicyActions.map((value) => ({
          value,
          label: actionLabels[value],
        })),
        onChange: this.handleActionChange,
      },
      {
        name: 'redirect_url',
        label: t('Redirect URL'),
        type: 'input',
        required: true,
        hidden: action !== 'REDIRECT_TO_URL',
        validator: (rule, value) => {
          const error = validateL7Policy({
            action: 'REDIRECT_TO_URL',
            redirect_url: value,
          }).redirect_url;
          return error ? Promise.reject(new Error(error)) : Promise.resolve();
        },
      },
      {
        name: 'redirect_http_code',
        label: t('Redirect HTTP Status Code'),
        type: 'select',
        hidden: action !== 'REDIRECT_TO_URL',
        required: true,
        allowClear: false,
        options: l7PolicyRedirectHttpCodes.map((value) => ({
          value,
          label: String(value),
        })),
      },
      {
        name: 'redirect_pool_id',
        label: t('Redirect Pool'),
        type: 'select',
        required: true,
        hidden: action !== 'REDIRECT_TO_POOL',
        loading: poolsLoading,
        disabled: poolsLoading || !!poolsError,
        optionFilterProp: 'label',
        options: pools.map(({ id, name }) => ({
          value: id,
          label: name ? `${name} (${id})` : id,
        })),
        extra:
          poolsError ||
          t(
            'Only active compatible pools from this load balancer and project are shown.'
          ),
        validator: this.validatePool,
      },
      {
        name: 'position',
        label: t('Position'),
        type: 'input-number',
        min: 1,
        max: 2147483647,
        extra: t(
          'Leave blank to keep the current position or append a new policy.'
        ),
        validator: (rule, value) =>
          positionError(value)
            ? Promise.reject(new Error(positionError(value)))
            : Promise.resolve(),
      },
      { name: 'admin_state_up', label: t('Admin State Up'), type: 'switch' },
    ];
  }

  onSubmit = async (values) => {
    const allowed = this.isEdit
      ? canChangePolicy(this.item, this.listener)
      : canChangePolicies(this.listener);
    if (!allowed)
      throw new Error(
        t(
          'The listener and load balancer must be active before changing L7 policies.'
        )
      );
    const data = policyPayload(values);
    if (data.action === 'REDIRECT_TO_POOL')
      await this.validatePool(null, data.redirect_pool_id);
    return this.isEdit
      ? this.store.update({ id: this.item.id }, data)
      : this.store.create({ ...data, listener_id: this.listener.id });
  };
}

export default inject('rootStore')(observer(Create));
