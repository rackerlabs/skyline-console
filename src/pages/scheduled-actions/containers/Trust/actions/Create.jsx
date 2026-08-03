import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import { ModalAction } from 'containers/Action';
import client from 'client';
import globalTrustStore from 'stores/keystone/trust';
import globalRoleStore from 'stores/keystone/role';
import { ProjectStore } from 'stores/keystone/project';
import { buildTrustBody } from 'resources/qonos';

const DEFAULT_ROLE_NAME = 'member';

export class Create extends ModalAction {
  static id = 'create-qonos-trust';

  static title = t('Create Trust');

  static policy = 'identity:create_trust';

  static aliasPolicy = '';

  static allowed = (_, containerProps) =>
    Promise.resolve(containerProps.rootStore.hasAdminRole);

  init() {
    this.store = globalTrustStore;
    this.roleStore = globalRoleStore;
    this.projectStore = new ProjectStore();
    this.state.users = [];
    this.state.usersLoading = false;
    this.fetchUsers();
    this.fetchProjects();
    this.fetchRoles();
  }

  get name() {
    return t('Create trust');
  }

  get trustorLabel() {
    const { user: { id, name } = {} } = this.currentUser || {};
    if (!id) {
      return '-';
    }
    return name ? `${name} (${id})` : id;
  }

  get currentUserId() {
    const { user: { id } = {} } = this.currentUser || {};
    return id;
  }

  get currentProjectId() {
    const { project: { id } = {} } = this.currentUser || {};
    return id;
  }

  get userOptions() {
    return (this.state.users || []).map((it) => ({
      label: it.domainName ? `${it.name} (${it.domainName})` : it.name || it.id,
      value: it.id,
    }));
  }

  get projectOptions() {
    return (toJS(this.projectStore.list.data) || []).map((it) => ({
      label: it.name ? `${it.name} (${it.id})` : it.id,
      value: it.id,
    }));
  }

  get roleOptions() {
    return (this.roleStore.list.data || []).map((it) => ({
      label: it.name,
      value: it.name,
    }));
  }

  get defaultValue() {
    return {
      roles: [DEFAULT_ROLE_NAME],
      impersonation: false,
      project_id: this.currentProjectId,
    };
  }

  async fetchUsers() {
    this.setState({ usersLoading: true });
    try {
      const domainResult = await client.keystone.domains.list();
      const domains = domainResult?.domains || [];
      const domainNameById = domains.reduce((acc, domain) => {
        acc[domain.id] = domain.name;
        return acc;
      }, {});
      const results = await Promise.all(
        domains.map((domain) =>
          client.keystone.users.list({ domain_id: domain.id })
        )
      );
      const users = results.flatMap((result) =>
        (result?.users || []).map((user) => ({
          ...user,
          domainName: domainNameById[user.domain_id] || user.domain_id,
        }))
      );
      this.setState({ users });
    } catch (e) {
      this.setState({ users: [] });
    } finally {
      this.setState({ usersLoading: false });
    }
  }

  fetchProjects() {
    this.projectStore.fetchProjectsWithDomain();
  }

  fetchRoles() {
    this.roleStore.fetchList();
  }

  get formItems() {
    return [
      {
        name: 'trustor',
        label: t('Trustor'),
        type: 'label',
        iconType: 'user',
        content: this.trustorLabel,
        tip: t(
          'Keystone only allows the currently authenticated user to be the trustor.'
        ),
      },
      {
        name: 'trustee_user_id',
        label: t('Trustee'),
        type: 'select',
        required: true,
        options: this.userOptions,
        loading: this.state.usersLoading,
        showSearch: true,
        tip: t(
          'User that is assuming authorization (includes users from all domains, e.g. service).'
        ),
      },
      {
        name: 'project_id',
        label: t('Project'),
        type: 'select',
        required: true,
        options: this.projectOptions,
        loading: this.projectStore.list.isLoading,
        showSearch: true,
        tip: t('Project being delegated.'),
      },
      {
        name: 'roles',
        label: t('Roles'),
        type: 'select',
        required: true,
        mode: 'multiple',
        options: this.roleOptions,
        loading: this.roleStore.list.isLoading,
        showSearch: true,
        tip: t('Roles to authorize on the project.'),
      },
      {
        name: 'impersonation',
        label: t('Impersonation'),
        type: 'switch',
        tip: t('Tokens generated from the trust will represent the trustor.'),
      },
      {
        name: 'expires_at',
        label: t('Expires At'),
        type: 'date-picker',
        showTime: true,
        tip: t('Optional expiration date for the trust.'),
      },
    ];
  }

  onSubmit = (values) =>
    this.store.create(
      buildTrustBody(
        {
          ...values,
          trustor_user_id: this.currentUserId,
        },
        this.currentUser
      )
    );
}

export default inject('rootStore')(observer(Create));
