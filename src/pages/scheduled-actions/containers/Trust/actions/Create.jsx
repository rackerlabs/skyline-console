import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import client from 'client';
import globalTrustStore from 'stores/keystone/trust';
import globalRoleStore from 'stores/keystone/role';
import { buildTrustBody } from 'resources/qonos';

const QONOS_USER_NAME = 'qonos';
const DEFAULT_ROLE_NAME = 'member';

export class Create extends ModalAction {
  static id = 'create-qonos-trust';

  static title = t('Create Trust');

  static policy = '';

  static aliasPolicy = 'keystone:identity:create_trust';

  static allowed = (_, containerProps) =>
    Promise.resolve(containerProps.rootStore.hasAdminRole);

  init() {
    this.store = globalTrustStore;
    this.roleStore = globalRoleStore;
    this.state.trusteeLoading = false;
    this.state.trusteeUserId = undefined;
    this.state.trusteeUserName = QONOS_USER_NAME;
    this.resolveTrustee();
    this.fetchRoles();
  }

  get name() {
    return t('Create trust');
  }

  get trustorInfo() {
    const { user: { id, name } = {} } = this.currentUser || {};
    return { id, name };
  }

  get projectInfo() {
    const { project: { id, name } = {} } = this.currentUser || {};
    return { id, name };
  }

  get roleOptions() {
    return (this.roleStore.list.data || []).map((it) => ({
      label: it.name,
      value: it.name,
    }));
  }

  get defaultValue() {
    return {
      role_name: DEFAULT_ROLE_NAME,
      impersonation: false,
    };
  }

  async resolveTrustee() {
    this.setState({ trusteeLoading: true });
    try {
      const result = await client.keystone.users.list({
        name: QONOS_USER_NAME,
      });
      const { users = [] } = result || {};
      const qonosUser =
        users.find((it) => it.name === QONOS_USER_NAME) || users[0];
      if (qonosUser && qonosUser.id) {
        this.setState({
          trusteeUserId: qonosUser.id,
          trusteeUserName: qonosUser.name || QONOS_USER_NAME,
        });
      }
    } catch (e) {
      // Leave trusteeUserId undefined so submit will surface a clear error.
    } finally {
      this.setState({ trusteeLoading: false });
    }
  }

  fetchRoles() {
    this.roleStore.fetchList();
  }

  renderTrusteeLabel() {
    const { trusteeLoading, trusteeUserId, trusteeUserName } = this.state;
    if (trusteeLoading) {
      return t('Loading {name} user...', { name: QONOS_USER_NAME });
    }
    if (!trusteeUserId) {
      return t('Unable to locate {name} service user in Keystone.', {
        name: QONOS_USER_NAME,
      });
    }
    return `${trusteeUserName} (${trusteeUserId})`;
  }

  renderTrustorLabel() {
    const { id, name } = this.trustorInfo;
    if (!id) {
      return '-';
    }
    return name ? `${name} (${id})` : id;
  }

  renderProjectLabel() {
    const { id, name } = this.projectInfo;
    if (!id) {
      return '-';
    }
    return name ? `${name} (${id})` : id;
  }

  get formItems() {
    return [
      {
        name: 'trustor',
        label: t('Trustor'),
        type: 'label',
        iconType: 'user',
        content: this.renderTrustorLabel(),
      },
      {
        name: 'trustee',
        label: t('Trustee'),
        type: 'label',
        iconType: 'user',
        content: this.renderTrusteeLabel(),
        tip: t(
          'The {name} service user is selected automatically and cannot be changed.',
          { name: QONOS_USER_NAME }
        ),
      },
      {
        name: 'project',
        label: t('Project'),
        type: 'label',
        iconType: 'project',
        content: this.renderProjectLabel(),
        tip: t('Trust is scoped to the project you are currently using.'),
      },
      {
        name: 'role_name',
        label: t('Role'),
        type: 'select',
        required: true,
        options: this.roleOptions,
        loading: this.roleStore.list.isLoading,
        showSearch: true,
      },
      {
        name: 'impersonation',
        label: t('Impersonation'),
        type: 'switch',
      },
      {
        name: 'expires_at',
        label: t('Expires At'),
        type: 'date-picker',
        showTime: true,
      },
    ];
  }

  onSubmit = (values) => {
    const { trusteeUserId } = this.state;
    const payload = {
      ...values,
      trustor_user_id: this.trustorInfo.id,
      trustee_user_id: trusteeUserId,
      project_id: this.projectInfo.id,
    };
    return this.store.create(buildTrustBody(payload, this.currentUser));
  };
}

export default inject('rootStore')(observer(Create));
