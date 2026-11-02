// Copyright 2021 99cloud
//
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

import { action, observable, set } from 'mobx';
import { getPromises } from 'components/PrometheusChart/utils/utils';
import MonitorBase from './monitor-base';

const serviceNameMap = {
  mysql_up: t('Database Service'),
  rabbitmq_identity_info: t('Message Queue Service'),
  memcached_up: t('Cache Service'),
};

function getOtherServiceName(metric = {}) {
  if (metric.memcached_server) {
    return metric.memcached_server;
  }
  if (metric.rabbitmq_node_name) {
    const node = String(metric.rabbitmq_node_name).replace(/^rabbit@/, '');
    return node.split('.')[0] || node;
  }
  if (metric.mysql_instance_endpoint) {
    return 'mariadb';
  }
  return (
    metric.service ||
    metric.job ||
    metric.pod ||
    serviceNameMap[metric.__name__] ||
    metric.__name__ ||
    ''
  );
}

function getOtherServiceHost(metric = {}) {
  if (metric.instance) {
    return metric.instance;
  }
  if (metric.memcached_endpoint) {
    return metric.memcached_endpoint;
  }
  if (metric.mysql_instance_endpoint) {
    return metric.mysql_instance_endpoint;
  }
  if (metric.rabbitmq_node_name) {
    return metric.rabbitmq_node_name;
  }
  return metric.pod || '';
}

function getAgentServiceName(metric = {}) {
  return metric.exported_service || metric.service || '';
}

function getAgentState(adminState = '') {
  const state = String(adminState || '').toLowerCase();
  if (state === 'disabled') {
    return 'disabled';
  }
  if (state === 'enabled' || state === 'up') {
    return 'up';
  }
  return 'down';
}

export class OpenstackServiceStore extends MonitorBase {
  // @observable
  // nodes = [];

  // @observable
  // node = {};

  @observable
  nova_service = {
    isLoading: false,
    data: [],
  };

  @observable
  network_service = {
    isLoading: false,
    data: [],
  };

  @observable
  cinder_service = {
    isLoading: false,
    data: [],
  };

  @observable
  other_service = {
    isLoading: false,
    data: [],
  };

  @action
  getChartData = async () => {
    // const { hostname } = this.node.metric;
    const defaultPromises = [
      this.getNovaService(),
      this.getNetworkService(),
      this.getCinderService(),
      this.getOtherService(),
    ];
    await Promise.all(defaultPromises);
  };

  @action
  getNovaService = async () => {
    set(this.nova_service, {
      isLoading: true,
      data: [],
    });
    const tmp = [];
    try {
      const [currentState, last24State, libvirtdState, libvirtd24State] =
        await Promise.all(getPromises('openstackService.novaService'));
      const {
        data: { result: currentStateResult },
      } = currentState;
      currentStateResult.forEach((service) => {
        const { metric = {} } = service;
        const { adminState = '', hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        tmp.push({
          hostname,
          serviceName,
          state: getAgentState(adminState),
        });
      });
      const {
        data: { result: last24HResult },
      } = last24State;
      last24HResult.forEach((service) => {
        const { metric = {} } = service;
        const { hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        const idx = tmp.findIndex(
          (item) =>
            item.serviceName === serviceName && item.hostname === hostname
        );
        if (idx >= 0) {
          tmp[idx][`${serviceName}24`] = 'disabled';
        }
      });
      const {
        data: { result: data },
      } = libvirtdState;
      data.forEach((item) => {
        const { metric, value } = item;
        tmp.push({
          // hard code
          serviceName: 'nova_libvirt',
          hostname: metric.hostname,
          state: value?.[1] === '1' || Number(value?.[1]) > 0 ? 'up' : 'down',
        });
      });
      const {
        data: { result: libvirtd24Result },
      } = libvirtd24State;
      libvirtd24Result.forEach((service) => {
        const { metric: { hostname = '' } = {} } = service;
        const idx = tmp.findIndex(
          (item) =>
            item.serviceName === 'nova_libvirt' && item.hostname === hostname
        );
        if (idx >= 0) {
          tmp[idx].nova_libvirt24 = 'down';
        }
      });
    } finally {
      set(this.nova_service, {
        isLoading: false,
        data: tmp,
      });
    }
  };

  @action
  getNetworkService = async () => {
    set(this.network_service, {
      isLoading: true,
      data: [],
    });
    const tmp = [];
    try {
      const [currentState, last24State] = await Promise.all(
        getPromises.call(this, 'openstackService.networkService')
      );
      const {
        data: { result: currentStateResult },
      } = currentState;
      currentStateResult.forEach((service) => {
        const { metric = {} } = service;
        const { adminState = '', hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        tmp.push({
          serviceName,
          hostname,
          state: getAgentState(adminState),
        });
      });
      const {
        data: { result: last24HResult },
      } = last24State;
      last24HResult.forEach((service) => {
        const { metric = {} } = service;
        const { hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        const idx = tmp.findIndex(
          (item) =>
            item.serviceName === serviceName && item.hostname === hostname
        );
        if (idx >= 0) {
          tmp[idx][`${serviceName}24`] = 'down';
        }
      });
    } finally {
      set(this.network_service, {
        isLoading: false,
        data: tmp,
      });
    }
  };

  @action
  getCinderService = async () => {
    set(this.cinder_service, {
      isLoading: true,
      data: [],
    });
    const tmp = [];
    try {
      const [currentState, last24State] = await Promise.all(
        getPromises.call(this, 'openstackService.cinderService')
      );
      const {
        data: { result: currentStateResult },
      } = currentState;
      currentStateResult.forEach((service) => {
        const { metric = {} } = service;
        const { adminState = '', hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        tmp.push({
          serviceName,
          hostname,
          state: getAgentState(adminState),
        });
      });
      const {
        data: { result: last24HResult },
      } = last24State;
      last24HResult.forEach((service) => {
        const { metric = {} } = service;
        const { hostname = '' } = metric;
        const serviceName = getAgentServiceName(metric);
        const idx = tmp.findIndex(
          (item) =>
            item.serviceName === serviceName && item.hostname === hostname
        );
        if (idx >= 0) {
          tmp[idx][`${serviceName}24`] = 'down';
        }
      });
    } finally {
      set(this.cinder_service, {
        isLoading: false,
        data: tmp,
      });
    }
  };

  @action
  getOtherService = async () => {
    set(this.other_service, {
      isLoading: true,
      data: [],
    });
    const tmp = [];
    try {
      let results = await Promise.all(
        getPromises.call(this, 'openstackService.otherService')
      );
      results.forEach((result) => {
        const data = result?.data?.result || [];
        data.forEach((d) => {
          const { metric = {}, value } = d;
          const serviceName = getOtherServiceName(metric);
          const hostname = getOtherServiceHost(metric);
          tmp.push({
            serviceName,
            hostname,
            state:
              value?.[1] === '1' || Number(value?.[1]) === 1 ? 'up' : 'down',
          });
        });
      });
      results = await Promise.all(
        getPromises.call(this, 'openstackService.otherServiceMinOverTime')
      );
      results.forEach((result) => {
        const last24HResult = result?.data?.result || [];
        last24HResult.forEach((service) => {
          const { metric = {} } = service;
          const hostname = getOtherServiceHost(metric);
          const serviceName = getOtherServiceName(metric);
          let idx = tmp.findIndex(
            (item) =>
              item.serviceName === serviceName && item.hostname === hostname
          );
          if (idx < 0) {
            idx = tmp.findIndex((item) => item.hostname === hostname);
          }
          if (idx >= 0) {
            tmp[idx][`${tmp[idx].serviceName}24`] = 'down';
          }
        });
      });
      // const [heatResponse, heat24Response] = await Promise.all(
      //   getPromises.call(this, 'openstackService.heatMinOverTime')
      // );
      // const {
      //   data: { result: heatResults },
      // } = heatResponse;
      // heatResults.forEach((item) => {
      //   const {
      //     metric: {
      //       host = '',
      //       binary = '',
      //       engine_id = '',
      //       services_status = '',
      //     } = {},
      //   } = item;
      //   tmp.push({
      //     serviceName: binary,
      //     host,
      //     state: services_status,
      //     engine_id,
      //   });
      // });
      // const {
      //   data: { result: heat24Results },
      // } = heat24Response;
      // heat24Results.forEach((result) => {
      //   const { metric: { binary = '', engine_id = '', host = '' } = {} } =
      //     result;
      //   const idx = tmp.findIndex(
      //     (item) =>
      //       item.serviceName === binary &&
      //       item.host === host &&
      //       item.engine_id === engine_id
      //   );
      //   tmp[idx][`${binary}24`] = 'down';
      // });
    } finally {
      set(this.other_service, {
        isLoading: false,
        data: tmp,
      });
    }
  };
}

const globalOpenstackServiceStore = new OpenstackServiceStore();

export default globalOpenstackServiceStore;
