import { inject, observer } from 'mobx-react';
import Base from 'containers/List';
import globalTrustStore, { TrustStore } from 'stores/keystone/trust';
import { emptyActionConfig } from 'utils/constants';
import actionConfigs from './actions';

export class Trust extends Base {
  init() {
    this.store = globalTrustStore;
    this.downloadStore = new TrustStore();
  }

  get policy() {
    return '';
  }

  get aliasPolicy() {
    return 'keystone:identity:list_trusts';
  }

  get name() {
    return t('trusts');
  }

  get actionConfigs() {
    return this.hasAdminRole ? actionConfigs : emptyActionConfig;
  }

  getDataWithPolicy(params) {
    if (!this.hasAdminRole) {
      this.list.isLoading = false;
      this.list.silent = false;
      return;
    }
    super.getDataWithPolicy(params);
  }

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
    return roles.map((it) => it.name || it.id).join(', ');
  };

  getColumns = () => [
    {
      title: t('ID'),
      dataIndex: 'id',
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
