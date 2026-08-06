import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import globalTrustStore, { TrustStore } from 'stores/keystone/trust';
import { fetchTrustsForQonosTrustee } from 'resources/qonos';
import { getIdRender } from 'utils/table';
import actionConfigs from './actions';

export class Trust extends Base {
  init() {
    this.store = globalTrustStore;
    this.downloadStore = new TrustStore();
  }

  get policy() {
    return 'identity:list_trusts_for_trustor';
  }

  get aliasPolicy() {
    return '';
  }

  get name() {
    return t('trusts');
  }

  get fetchDataByAllProjects() {
    return false;
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getData = async ({ silent } = {}) => {
    silent && (this.list.silent = true);
    this.list.data = [];
    this.list.isLoading = true;
    try {
      await fetchTrustsForQonosTrustee(
        this.store,
        this.currentUser?.user?.id,
        this.currentUser?.project?.id || this.currentProjectId,
        { withRoles: true }
      );
    } catch (e) {
      this.list.data = [];
    } finally {
      this.list.isLoading = false;
      this.list.silent = false;
    }
  };

  get searchFilters() {
    return [
      {
        label: t('Trust ID'),
        name: 'id',
      },
      {
        label: t('Project ID'),
        name: 'project_id',
      },
    ];
  }

  renderRoles = (roles = []) => {
    if (!roles || !roles.length) {
      return '-';
    }
    const names = roles
      .map((it) => (typeof it === 'string' ? it : it.name || it.id))
      .filter(Boolean);
    return names.length ? names.join(', ') : '-';
  };

  getColumns = () => [
    {
      title: t('ID'),
      dataIndex: 'id',
      render: (value) => (value ? getIdRender(value, true, true) : '-'),
    },
    {
      title: t('Project ID'),
      dataIndex: 'project_id',
    },
    {
      title: t('Trustor User ID'),
      dataIndex: 'trustor_user_id',
      isHideable: true,
    },
    {
      title: t('Trustee User ID'),
      dataIndex: 'trustee_user_id',
    },
    {
      title: t('Roles'),
      dataIndex: 'roles',
      render: this.renderRoles,
      stringify: this.renderRoles,
    },
    {
      title: t('Impersonation'),
      dataIndex: 'impersonation',
      valueRender: 'yesNo',
      isHideable: true,
    },
    {
      title: t('Expires At'),
      dataIndex: 'expires_at',
      valueRender: 'toLocalTime',
      isHideable: true,
    },
  ];
}

export default inject('rootStore')(observer(Trust));
