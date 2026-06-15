import React from 'react';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';
import { TrustStore } from 'stores/keystone/trust';
import { buildExecutionProfileBody } from 'resources/qonos';
import TrustIdInput from '../../../components/TrustIdInput';

export class Create extends ModalAction {
  static id = 'create-qonos-execution-profile';

  static title = t('Create Execution Profile');

  static policy = '';

  static aliasPolicy = 'qonos:execution_profiles:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalExecutionProfileStore;
    this.trustStore = new TrustStore();
    this.trustStore.fetchList().catch(() => {
      this.trustStore.list.isLoading = false;
    });
  }

  get name() {
    return t('Create execution profile');
  }

  get defaultValue() {
    return {
      auth_type: 'trust',
      enabled: true,
    };
  }

  get trustOptions() {
    return (this.trustStore.list.data || []).map((it) => ({
      label: `${it.id}${it.project_id ? ` (${it.project_id})` : ''}`,
      value: it.id,
    }));
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        placeholder: t('Please input name'),
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        rows: 3,
      },
      {
        name: 'auth_type',
        label: t('Auth Type'),
        type: 'select',
        options: [{ label: t('Trust'), value: 'trust' }],
        disabled: true,
        required: true,
      },
      {
        name: 'trust_id',
        label: t('Trust ID'),
        required: true,
        component: (
          <TrustIdInput
            options={this.trustOptions}
            placeholder={t('Select or input trust ID')}
          />
        ),
      },
      {
        name: 'enabled',
        label: t('Enabled'),
        type: 'switch',
      },
    ];
  }

  onSubmit = (values) => this.store.create(buildExecutionProfileBody(values));
}

export default inject('rootStore')(observer(Create));
