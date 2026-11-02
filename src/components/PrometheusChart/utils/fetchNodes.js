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

import { fetchPrometheus } from 'components/PrometheusChart/utils/utils';
import { get } from 'lodash';
import isEqual from 'react-fast-compare';

async function fetchNodeResults(metricPath) {
  try {
    const ret = await fetchPrometheus(get(METRICDICT, metricPath), 'current');
    return get(ret, 'data.result', []) || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return [];
  }
}

export const defaultGetNodes = async () => {
  const results = await fetchNodeResults('physicalNode.systemLoad.url[0]');
  return results.map((result) => ({
    metric: {
      instance: result.metric.instance,
    },
  }));
};

export const getMemcacheNodes = async () => {
  const results = await fetchNodeResults(
    'memcacheService.currentConnections.url[0]'
  );
  return results.map((result) => ({
    metric: {
      instance: result.metric.instance,
    },
  }));
};

export const getRabbitMQNodes = async () => {
  let results = [];
  try {
    const ret = await fetchPrometheus(
      '(rabbitmq_identity_info) or (max by (rabbitmq_node_name) (rabbitmq_node_mem_used) * 0 + 1)',
      'current'
    );
    results = get(ret, 'data.result', []) || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    results = [];
  }
  const ret = [];
  results.forEach((result) => {
    const nodeName = result.metric.rabbitmq_node_name;
    const item = {
      metric: nodeName
        ? { rabbitmq_node_name: nodeName }
        : { instance: result.metric.instance },
    };
    if (!ret.find((i) => isEqual(i, item))) {
      ret.push(item);
    }
  });
  return ret;
};

export const getMysqlNodes = async () => {
  let results = [];
  try {
    const ret = await fetchPrometheus(
      '(mysql_global_status_uptime) or (mysql_uptime_seconds_total)',
      'current'
    );
    results = get(ret, 'data.result', []) || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    results = [];
  }
  const ret = [];
  results.forEach((result) => {
    const endpoint = result.metric.mysql_instance_endpoint;
    const item = {
      metric: endpoint
        ? { mysql_instance_endpoint: endpoint }
        : { instance: result.metric.instance },
    };
    if (!ret.find((i) => isEqual(i, item))) {
      ret.push(item);
    }
  });
  return ret;
};
