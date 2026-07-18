import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import { RouterStore } from 'stores/neutron/router';
import { NetworkStore } from 'stores/neutron/network';

// Basic-mode router create. Mirrors the required Advanced fields —
// Name, Description, Open External Gateway (Yes/No), and the External
// Gateway picker when Yes. The picker is a searchable Select instead
// of the Advanced table.
export class BasicRouterCreate extends FormAction {
  static id = 'basic-router-create';

  static title = t('Create Router');

  static path = '/basic/network/router/create';

  static policy = 'create_router';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = new RouterStore();
    this.networkStore = new NetworkStore();
    this.loadResources();
  }

  async loadResources() {
    // Advanced pulls the external networks via fetchListByPage (the
    // select-table's default). fetchList would apply the
    // listFilterByProject filter and drop networks owned by other
    // projects, which is exactly what excludes admin-owned externals.
    // Ask for a large enough page to cover the typical deployment.
    await this.networkStore.fetchListByPage({
      'router:external': true,
      limit: 100,
    });
  }

  get name() {
    return t('create router');
  }

  get listUrl() {
    return '/basic/network/router';
  }

  get nameForStateUpdate() {
    return ['openExternalNetwork'];
  }

  get externalNetworks() {
    return (this.networkStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name || it.id,
    }));
  }

  get defaultValue() {
    return {
      openExternalNetwork: false,
    };
  }

  get openExternal() {
    return this.state.openExternalNetwork === true;
  }

  get formItems() {
    const { openExternal } = this;
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      {
        name: 'openExternalNetwork',
        label: t('Open External Gateway'),
        type: 'radio',
        required: true,
        options: [
          { value: true, label: t('Yes') },
          { value: false, label: t('No') },
        ],
      },
      {
        name: 'externalNetwork',
        label: t('External Gateway'),
        type: 'select',
        required: openExternal,
        hidden: !openExternal,
        options: this.externalNetworks,
        loading: this.networkStore.list.isLoading,
        autoSelectFirst: true,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: t('Search'),
      },
    ];
  }

  onSubmit = (values) => {
    const { openExternalNetwork, externalNetwork, ...others } = values;
    const body = { ...others };
    if (openExternalNetwork && externalNetwork) {
      body.external_gateway_info = { network_id: externalNetwork };
    }
    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(BasicRouterCreate));
