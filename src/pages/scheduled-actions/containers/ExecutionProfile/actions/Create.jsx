import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';
import { TrustStore } from 'stores/keystone/trust';
import globalRootStore from 'stores/root';
import {
  buildExecutionProfileBody,
  fetchTrustsForQonosTrustee,
  normalizeTrustId,
} from 'resources/qonos';

export class Create extends ModalAction {
  static id = 'create-qonos-execution-profile';

  static title = t('Create Execution Profile');

  static policy = '';

  static aliasPolicy = 'qonos:execution_profiles:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalExecutionProfileStore;
    this.trustStore = new TrustStore();
    fetchTrustsForQonosTrustee(
      this.trustStore,
      globalRootStore.user?.user?.id,
      globalRootStore.user?.project?.id || globalRootStore.projectId
    ).catch(() => {
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
        type: 'select',
        required: true,
        options: this.trustOptions,
        showSearch: true,
        tip: t(
          'Only trusts whose trustee is the Qonos service user are listed.'
        ),
      },
      {
        name: 'enabled',
        label: t('Enabled'),
        type: 'switch',
      },
    ];
  }

  onSubmit = (values) => {
    const trustId = normalizeTrustId(values.trust_id);
    if (!trustId) {
      return Promise.reject(new Error(t('Please select a trust ID.')));
    }
    return this.store.create(
      buildExecutionProfileBody({
        ...values,
        trust_id: trustId,
      })
    );
  };
}

export default inject('rootStore')(observer(Create));
