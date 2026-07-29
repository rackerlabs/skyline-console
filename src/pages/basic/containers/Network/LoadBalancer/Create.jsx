import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import globalLbaasStore from 'stores/octavia/loadbalancer';
import globalLoadBalancerProviderStore from 'stores/octavia/provider';
import { NetworkStore } from 'stores/neutron/network';
import { SubnetStore } from 'stores/neutron/subnet';
import {
  listenerProtocols,
  poolProtocols,
  healthProtocols,
} from 'resources/octavia/lb';
import {
  Algorithm,
  OvnPoolAlgorithm,
  algorithmTip,
} from 'resources/octavia/pool';

// Basic-mode single-page load balancer create. Advanced uses a
// multi-step wizard (Base, Listener, Pool, Member, Health Monitor);
// Basic collapses everything into one page, groups fields under
// section titles, and only keeps the fields marked required in the
// Advanced flow. Table pickers become searchable Selects.
export class BasicLoadBalancerCreate extends FormAction {
  static id = 'basic-lb-create';

  static title = t('Create Loadbalancer');

  static path = '/basic/network/load-balancers/create';

  static policy = 'os_load-balancer_api:loadbalancer:post';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalLbaasStore;
    this.providerStore = globalLoadBalancerProviderStore;
    this.networkStore = new NetworkStore();
    this.subnetStore = new SubnetStore();
    this.state = {
      ...(this.state || {}),
      subnetDetails: [],
    };
    this.loadResources();
  }

  async loadResources() {
    await Promise.all([
      this.providerStore.fetchList(),
      this.networkStore.fetchListByPage({ limit: 100 }),
    ]);
    this.updateDefaultValue();
  }

  get name() {
    return t('Create Loadbalancer');
  }

  get listUrl() {
    return '/basic/network/load-balancers';
  }

  get nameForStateUpdate() {
    // Provider drives every subsequent filter; listener_protocol
    // narrows pool + health type; the rest drive show/hide.
    return [
      'vip_network_id',
      'provider',
      'listener_protocol',
      'pool_lb_algorithm',
      'enableHealthMonitor',
    ];
  }

  // ---------- Option lists ----------

  get networks() {
    return (this.networkStore.list.data || []).map((it) => ({
      value: it.id,
      label: it.name || it.id,
    }));
  }

  get subnetOptions() {
    return (this.state.subnetDetails || []).map((it) => ({
      value: it.id,
      label: it.name ? `${it.name} · ${it.cidr}` : it.cidr,
    }));
  }

  get providerOptions() {
    const list = this.providerStore.list.data || [];
    return list.length > 0
      ? list
      : [
          { label: 'amphora', value: 'amphora' },
          { label: 'ovn', value: 'ovn' },
        ];
  }

  get isOVN() {
    return this.state.provider === 'ovn';
  }

  get listenerProtocolOptions() {
    return this.isOVN
      ? listenerProtocols.filter((it) => ['TCP', 'UDP'].includes(it.value))
      : listenerProtocols;
  }

  // Pool Protocol matches Advanced: filter to protocols whose label
  // is contained in the picked listener protocol (so e.g. `HTTP`
  // narrows to HTTP, `TCP` narrows to TCP). OVN further restricts
  // to TCP/UDP.
  get poolProtocolOptions() {
    const listenerProtocol = this.state.listener_protocol || '';
    let base = poolProtocols;
    if (listenerProtocol) {
      base = poolProtocols.filter((it) => listenerProtocol.includes(it.label));
    }
    return this.isOVN
      ? base.filter((it) => ['TCP', 'UDP'].includes(it.value))
      : base;
  }

  get poolAlgorithmOptions() {
    return this.isOVN ? OvnPoolAlgorithm : Algorithm;
  }

  // Health Monitor Type matches Advanced: same listener-protocol
  // narrowing as pool protocol, further restricted to TCP/UDP-CONNECT
  // when the provider is OVN.
  get healthProtocolOptions() {
    const listenerProtocol = this.state.listener_protocol || '';
    let base = healthProtocols;
    if (listenerProtocol) {
      base = healthProtocols.filter((it) =>
        listenerProtocol.includes(it.label)
      );
    }
    return this.isOVN
      ? base.filter((it) => ['TCP', 'UDP-CONNECT'].includes(it.value))
      : base;
  }

  get defaultValue() {
    return {
      admin_state_enabled: true,
      provider: 'amphora',
      listener_connection_limit: -1,
      listener_admin_state_up: true,
      pool_admin_state_up: true,
      // Health Monitor defaults Advanced seeds when the step opens.
      enableHealthMonitor: false,
      health_delay: 5,
      health_timeout: 3,
      health_max_retries: 3,
      monitor_admin_state_up: true,
    };
  }

  // Provider change: reset any picks that may no longer be valid for
  // the new provider (algorithm list swaps, pool/health type
  // restrictions kick in). Advanced does the same in each step.
  onProviderChange = (provider) => {
    this.formRef?.current?.setFieldsValue({
      pool_lb_algorithm: provider === 'ovn' ? 'SOURCE_IP_PORT' : undefined,
      pool_protocol: undefined,
      health_type: undefined,
      // Listener protocol options change too — clear so autoSelectFirst
      // picks a valid value from the new option set.
      listener_protocol:
        provider === 'ovn' ? undefined : this.state.listener_protocol,
    });
  };

  // Listener protocol change: pool + health type options are derived
  // from listener protocol. Clear them so autoSelectFirst re-seeds
  // with something valid.
  onListenerProtocolChange = () => {
    this.formRef?.current?.setFieldsValue({
      pool_protocol: undefined,
      health_type: undefined,
    });
  };

  onNetworkChange = async (networkId) => {
    if (!networkId) {
      this.setState({ subnetDetails: [] });
      return;
    }
    try {
      const subnets = await this.subnetStore.fetchList({
        network_id: networkId,
      });
      this.setState({ subnetDetails: subnets || [] });
    } catch (e) {
      this.setState({ subnetDetails: [] });
    }
    // Reset VIP fields when the network changes.
    this.formRef?.current?.setFieldsValue({
      vip_subnet_id: undefined,
      vip_address: undefined,
    });
  };

  get formItems() {
    const searchable = {
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: t('Search'),
    };
    const showSubnet = !!this.state.vip_network_id;
    const enableMonitor = this.state.enableHealthMonitor === true;
    return [
      // ---------------- Base Config ----------------
      {
        name: 'baseTitle',
        label: t('Base Config'),
        type: 'title',
      },
      {
        name: 'name',
        label: t('Load Balancer Name'),
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
        name: 'provider',
        label: t('Provider'),
        type: 'select',
        required: true,
        options: this.providerOptions,
        onChange: this.onProviderChange,
        autoSelectFirst: true,
      },
      {
        name: 'vip_network_id',
        label: t('Owned Network'),
        type: 'select',
        required: true,
        loading: this.networkStore.list.isLoading,
        options: this.networks,
        onChange: this.onNetworkChange,
        autoSelectFirst: true,
        ...searchable,
      },
      {
        name: 'vip_subnet_id',
        label: t('Owned Subnet'),
        type: 'select',
        required: showSubnet,
        hidden: !showSubnet,
        options: this.subnetOptions,
        autoSelectFirst: true,
        ...searchable,
      },
      {
        name: 'vip_address',
        label: t('IP Address'),
        type: 'input',
        placeholder: t('Leave blank to auto-assign'),
        tip: t('Optional: pin a specific IP within the selected subnet.'),
      },
      {
        name: 'admin_state_enabled',
        label: t('Admin State Up'),
        type: 'switch',
      },
      // ---------------- Listener Detail ----------------
      { name: 'listenerDivider', type: 'divider' },
      { name: 'listenerTitle', label: t('Listener Detail'), type: 'title' },
      {
        name: 'listener_name',
        label: t('Listener Name'),
        type: 'input-name',
        required: true,
      },
      {
        name: 'listener_protocol',
        label: t('Listener Protocol'),
        type: 'select',
        required: true,
        options: this.listenerProtocolOptions,
        onChange: this.onListenerProtocolChange,
        autoSelectFirst: true,
      },
      {
        name: 'listener_protocol_port',
        label: t('Listener Protocol Port'),
        type: 'input-number',
        required: true,
      },
      {
        name: 'listener_connection_limit',
        label: t('Listener Connection Limit'),
        type: 'input-number',
        min: -1,
        required: true,
        extra: t('-1 means no connection limit'),
      },
      {
        name: 'listener_admin_state_up',
        label: t('Admin State Up'),
        type: 'switch',
      },
      // ---------------- Pool Detail ----------------
      { name: 'poolDivider', type: 'divider' },
      { name: 'poolTitle', label: t('Pool Detail'), type: 'title' },
      {
        name: 'pool_name',
        label: t('Pool Name'),
        type: 'input-name',
        required: true,
      },
      {
        name: 'pool_lb_algorithm',
        label: t('Pool Algorithm'),
        type: 'select',
        required: true,
        options: this.poolAlgorithmOptions,
        autoSelectFirst: true,
        extra:
          (this.state.pool_lb_algorithm &&
            algorithmTip[this.state.pool_lb_algorithm]) ||
          undefined,
      },
      {
        name: 'pool_protocol',
        label: t('Pool Protocol'),
        type: 'select',
        required: true,
        options: this.poolProtocolOptions,
        autoSelectFirst: true,
      },
      {
        name: 'pool_admin_state_up',
        label: t('Admin State Up'),
        type: 'switch',
      },
      // ---------------- Health Monitor Detail ----------------
      { name: 'healthDivider', type: 'divider' },
      {
        name: 'healthTitle',
        label: t('Health Monitor Detail'),
        type: 'title',
      },
      {
        name: 'enableHealthMonitor',
        label: t('Enable Health Monitor'),
        type: 'radio',
        options: [
          { value: true, label: t('Yes') },
          { value: false, label: t('No') },
        ],
      },
      {
        name: 'health_name',
        label: t('Health Monitor Name'),
        type: 'input-name',
        required: enableMonitor,
        hidden: !enableMonitor,
      },
      {
        name: 'health_type',
        label: t('Health Monitor Type'),
        type: 'select',
        required: enableMonitor,
        hidden: !enableMonitor,
        options: this.healthProtocolOptions,
        autoSelectFirst: true,
      },
      {
        name: 'health_delay',
        label: t('Health Monitor Delay'),
        type: 'input-number',
        min: 0,
        required: enableMonitor,
        hidden: !enableMonitor,
        extra: t('Maximum interval time for each health check response'),
      },
      {
        name: 'health_max_retries',
        label: t('Health Monitor Max Retries'),
        type: 'input-number',
        min: 1,
        max: 10,
        required: enableMonitor,
        hidden: !enableMonitor,
      },
      {
        name: 'health_timeout',
        label: t('Health Monitor Timeout'),
        type: 'input-number',
        min: 0,
        required: enableMonitor,
        hidden: !enableMonitor,
      },
    ];
  }

  onSubmit = (values) => {
    const {
      name,
      description,
      provider,
      vip_network_id,
      vip_subnet_id,
      vip_address,
      admin_state_enabled,
      listener_name,
      listener_description,
      listener_protocol,
      listener_protocol_port,
      listener_connection_limit,
      listener_admin_state_up,
      pool_name,
      pool_description,
      pool_lb_algorithm,
      pool_protocol,
      pool_admin_state_up,
      enableHealthMonitor,
      health_name,
      health_type,
      health_delay,
      health_max_retries,
      health_timeout,
    } = values;

    const data = {
      name,
      description,
      admin_state_up: admin_state_enabled,
      provider,
      vip_network_id,
      vip_subnet_id,
    };
    if (vip_address) {
      data.vip_address = vip_address;
    }

    const poolData = {
      name: pool_name,
      description: pool_description,
      lb_algorithm: pool_lb_algorithm,
      protocol: pool_protocol,
      admin_state_up: pool_admin_state_up,
      members: [],
    };
    if (enableHealthMonitor) {
      poolData.healthmonitor = {
        name: health_name,
        type: health_type,
        delay: health_delay,
        max_retries: health_max_retries,
        timeout: health_timeout,
        admin_state_up: true,
        ...(provider !== 'ovn' &&
        health_type !== 'TCP' &&
        health_type !== 'UDP-CONNECT'
          ? { url_path: '/' }
          : {}),
      };
    }

    const listenerData = {
      name: listener_name,
      description: listener_description,
      protocol: listener_protocol,
      protocol_port: listener_protocol_port,
      connection_limit: listener_connection_limit,
      admin_state_up: listener_admin_state_up,
      default_pool: poolData,
    };

    data.listeners = [listenerData];
    return this.store.create(data);
  };
}

export default inject('rootStore')(observer(BasicLoadBalancerCreate));
