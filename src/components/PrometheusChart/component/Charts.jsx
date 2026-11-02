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

import React, { useContext } from 'react';
import { get, merge } from 'lodash';

import { Col, Row } from 'antd';
import { handleResponses } from '../utils/dataHandler';
import styles from './styles.less';
import BaseCard from '../BaseCard';
import ChartCard from '../ChartCard';
import BaseContentContext from './context';

function applyNodeFilter(params, node) {
  if (!node?.metric) {
    return;
  }
  if (node.metric.hostname) {
    params.hostname = node.metric.hostname;
  } else if (node.metric.mysql_instance_endpoint) {
    params.mysql_instance_endpoint = node.metric.mysql_instance_endpoint;
  } else if (node.metric.rabbitmq_node_name) {
    params.rabbitmq_node_name = node.metric.rabbitmq_node_name;
  } else if (node.metric.instance) {
    params.instance = node.metric.instance;
  }
}

const Charts = (props) => {
  const {
    baseTopCardProps,
    baseChartProps,
    topCardList,
    chartCardList,
    fetchPrometheusFunc,
  } = props;

  const ctx = useContext(BaseContentContext);

  function renderTopCards() {
    return (
      <Row gutter={[16, 16]}>
        {topCardList.map((chartProps) => {
          if (chartProps.hidden) {
            return null;
          }
          const config = merge({}, baseTopCardProps, chartProps);
          const { span, fetchDataParams = {}, ...rest } = config;
          const colProps = {
            key: rest.title,
          };
          if (!span) {
            colProps.flex = 1;
          } else {
            colProps.span = span;
          }

          const { params = {} } = fetchDataParams;

          const newFetchDataParams = {
            currentRange: ctx.range,
            interval: ctx.interval,
            params: { ...params },
          };
          if (!config.ignoreNodeFilter) {
            applyNodeFilter(newFetchDataParams.params, ctx.node);
          }
          return (
            <Col {...colProps}>
              <BaseCard
                {...rest}
                fetchDataParams={newFetchDataParams}
                fetchPrometheusFunc={fetchPrometheusFunc}
              />
            </Col>
          );
        })}
      </Row>
    );
  }

  function renderChartCards() {
    return (
      <Row gutter={[16, 16]}>
        {chartCardList.map((chartProps) => {
          const config = merge({}, baseChartProps, chartProps);
          const { span, fetchDataParams = {}, ...rest } = config;
          const colProps = {
            key: rest.title,
          };
          if (!span) {
            colProps.flex = 1;
          } else {
            colProps.span = span;
          }

          const { params = {} } = fetchDataParams;

          const newFetchDataParams = {
            currentRange: ctx.range,
            interval: ctx.interval,
            params: { ...params },
          };
          if (!config.ignoreNodeFilter) {
            applyNodeFilter(newFetchDataParams.params, ctx.node);
          }
          return (
            <Col {...colProps}>
              <ChartCard
                {...rest}
                fetchDataParams={newFetchDataParams}
                fetchPrometheusFunc={fetchPrometheusFunc}
              />
            </Col>
          );
        })}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {topCardList.length !== 0 && <Col span={24}>{renderTopCards()}</Col>}
      {chartCardList.length !== 0 && <Col span={24}> {renderChartCards()}</Col>}
    </Row>
  );
};

Charts.defaultProps = {
  baseTopCardProps: {
    createFetchParams: {
      requestType: 'current',
    },
    handleDataParams: {
      formatDataFn: handleResponses,
    },
    renderContent: ({ data }) => {
      const y = get(data, '[0].y');
      const hasData = Array.isArray(data) && data.length > 0 && y != null;
      return <div className={styles['top-content']}>{hasData ? y : '-'}</div>;
    },
  },
  baseChartProps: {
    span: 12,
    createFetchParams: {
      requestType: 'range',
    },
    handleDataParams: {
      formatDataFn: handleResponses,
    },
    chartProps: {
      height: 300,
      scale: {
        y: {
          nice: true,
        },
      },
    },
  },
  topCardList: [],
  chartCardList: [],
};

export default Charts;
