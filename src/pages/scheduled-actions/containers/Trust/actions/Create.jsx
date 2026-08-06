import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalTrustStore from 'stores/keystone/trust';
import { buildTrustBody, resolveQonosUserId } from 'resources/qonos';

export class Create extends ModalAction {
  static id = 'create-qonos-trust';

  static title = t('Create Trust');

  static policy = 'identity:create_trust';

  static aliasPolicy = '';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalTrustStore;
  }

  get name() {
    return t('Create trust');
  }

  get messageHasItemName() {
    return false;
  }

  get trustorLabel() {
    return this.currentUserId || '-';
  }

  get projectLabel() {
    return this.currentProjectId || '-';
  }

  get currentUserId() {
    return this.currentUser?.user?.id;
  }

  get currentProjectId() {
    return this.currentUser?.project?.id;
  }

  get trusteeUserId() {
    return resolveQonosUserId();
  }

  get trusteeLabel() {
    return this.trusteeUserId || '-';
  }

  get roleOptions() {
    const roles = this.props.rootStore?.roles || this.currentUser?.roles || [];
    return roles.map((it) => ({
      label: it.name || it.id,
      value: it.id,
    }));
  }

  get defaultRoleIds() {
    const roles = this.props.rootStore?.roles || this.currentUser?.roles || [];
    const admin = roles.find((r) => r.name === 'admin');
    if (admin?.id) {
      return [admin.id];
    }
    return roles.map((r) => r.id).filter(Boolean);
  }

  get defaultValue() {
    return {
      trustor: this.trustorLabel,
      trustee: this.trusteeLabel,
      project: this.projectLabel,
      roles: this.defaultRoleIds,
      impersonation: true,
    };
  }

  get formItems() {
    return [
      {
        name: 'trustor',
        label: t('Trustor'),
        type: 'label',
        iconType: 'user',
        content: this.trustorLabel,
        required: true,
        tip: t(
          'The trustor is automatically set to the currently authenticated user and cannot be changed.'
        ),
      },
      {
        name: 'trustee',
        label: t('Trustee'),
        type: 'label',
        iconType: 'user',
        content: this.trusteeLabel,
        required: true,
        tip: t(
          'The trustee is the Qonos service user that uses this trust to perform operations on your behalf.'
        ),
      },
      {
        name: 'project',
        label: t('Project'),
        type: 'label',
        iconType: 'project',
        content: this.projectLabel,
        required: true,
        tip: t('This trust is scoped to the project you are currently using.'),
      },
      {
        name: 'roles',
        label: t('Roles'),
        type: 'select',
        required: true,
        mode: 'multiple',
        options: this.roleOptions,
        tip: t(
          'Select one or more roles to delegate to the trustee for this project.'
        ),
      },
      {
        name: 'impersonation',
        label: t('Impersonation'),
        type: 'switch',
        tip: t(
          'When enabled, the trustee performs operations on your behalf using the delegated roles.'
        ),
      },
      {
        name: 'expires_at',
        label: t('Expires At'),
        type: 'date-picker',
        showTime: true,
        tip: t(
          'Set an optional expiration date after which the trust can no longer be used.'
        ),
      },
    ];
  }

  onSubmit = (values) => {
    const { trusteeUserId } = this;
    if (!trusteeUserId) {
      const error = new Error(t('Trustee is the Qonos service user'));
      error.response = {
        data: { detail: t('Trustee is the Qonos service user') },
      };
      return Promise.reject(error);
    }
    if (!values.roles || !values.roles.length) {
      const error = new Error(t('Please select at least one role.'));
      error.response = {
        data: { detail: t('Please select at least one role.') },
      };
      return Promise.reject(error);
    }
    return this.store.create(
      buildTrustBody(
        {
          ...values,
          trustor_user_id: this.currentUserId,
          trustee_user_id: trusteeUserId,
          project_id: this.currentProjectId,
        },
        this.currentUser
      )
    );
  };
}

export default inject('rootStore')(observer(Create));
