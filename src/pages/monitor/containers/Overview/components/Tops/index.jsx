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

import React from 'react';
import { Col, Progress, Row, Tabs } from 'antd';
import { get } from 'lodash';
import { Axis, Chart, Interval, Tooltip } from 'bizcharts';
import styles from '../../index.less';

export const shortHostLabel = (instance = '') =>
  String(instance).split(':')[0].split('.')[0] || instance;

export const renderTopProgress = ({ data }) => {
  return (
    <Row style={{ height: '100%' }}>
      {data.map((d) => {
        const percentage = get(d, 'y', 0);
        const percentageColor =
          percentage > 80 ? globalCSS.warnDarkColor : globalCSS.normalColor;
        return (
          <Col span={24} key={d.type}>
            <div>{d.type}</div>
            <Progress
              strokeColor={percentageColor}
              percent={percentage}
              style={{ marginBottom: 4 }}
              showInfo={percentage !== 100}
            />
          </Col>
        );
      })}
    </Row>
  );
};

export const renderTopColumnExtra = ({ modifyKeys, filterChartData }) => {
  return (
    <Tabs
      className={styles.tabs}
      defaultActiveKey={modifyKeys[0]}
      onChange={(key) => filterChartData((i) => i.type === key)}
    >
      {modifyKeys.map((k) => (
        <Tabs.TabPane tab={k} key={k} />
      ))}
    </Tabs>
  );
};

export const renderTopColumnChart = ({ data, modifyKeys, yFormatter }) => {
  const points = data || [];
  const types = [...new Set(points.map((d) => d.type))];
  const chartData =
    types.length <= 1 ? points : points.filter((d) => d.type === modifyKeys[0]);
  return (
    <Chart
      autoFit
      data={chartData}
      height={240}
      padding={[16, 16, 48, 64]}
      scale={{
        x: {
          type: 'cat',
          tickCount: chartData.length || 5,
        },
        y: {
          nice: true,
          formatter: yFormatter,
        },
      }}
    >
      <Axis
        name="x"
        label={{
          autoRotate: false,
          autoHide: false,
          rotate: 0,
          style: {
            fontSize: 10,
            textAlign: 'center',
          },
        }}
      />
      <Axis
        name="y"
        label={{
          autoHide: false,
          autoEllipsis: false,
          style: {
            fontSize: 10,
            textAlign: 'end',
          },
        }}
      />
      <Tooltip />
      <Interval position="x*y" size={18} />
    </Chart>
  );
};
