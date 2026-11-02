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

import React, { useState, useEffect } from 'react';
import { Col, Empty, Row, Spin } from 'antd';
import styles from 'pages/monitor/containers/Overview/index.less';
import { handleResponse } from 'components/PrometheusChart/utils/dataHandler';
import moment from 'moment';
import {
  createDataHandler,
  createFetchPrometheusClient,
} from 'components/PrometheusChart/utils';
import { Chart, Line, Tooltip } from 'bizcharts';
import { shortHostLabel } from '../Tops';

const STEP = 15;

const uniqueHosts = (points = []) => {
  const hosts = new Set();
  points.forEach((p) => {
    if (p.device) {
      hosts.add(p.device);
    }
  });
  return [...hosts].sort();
};

const Index = function () {
  const fetchData = createFetchPrometheusClient({
    requestType: 'range',
    metricKey: 'monitorOverview.alertInfo',
  });

  const dataHandler = createDataHandler({
    formatDataFn: (responses, typeKey, deviceKey, modifyKeys) => {
      const ret = [];
      responses.forEach((response, idx) => {
        ret.push(handleResponse(response, typeKey, deviceKey, modifyKeys[idx]));
      });
      return ret;
    },
    deviceKey: 'instance',
    modifyKeys: ['cpu', 'memory'],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [cpuHosts, setCpuHosts] = useState([]);
  const [memHosts, setMemHosts] = useState([]);
  const [weekData, setWeekData] = useState(build7DaysData());

  const fetchDataByDate = async (date) => {
    const end = moment(date).endOf('day');
    const start = moment(date).startOf('day');
    const result = await fetchData({
      interval: STEP,
      currentRange: [start, end],
    });
    const [cpuData = [], memoryData = []] = dataHandler(result).retData || [];
    const cpuHostList = uniqueHosts(cpuData);
    const memHostList = uniqueHosts(memoryData);
    return {
      date,
      total: cpuHostList.length + memHostList.length,
      cpuTotal: cpuHostList.length,
      memTotal: memHostList.length,
      cpuHosts: cpuHostList,
      memHosts: memHostList,
    };
  };

  const fetchWeekData = async () => {
    setIsLoading(true);
    const base = build7DaysData();
    const reqs = base.map((it) => fetchDataByDate(it.fullDate));
    try {
      const results = await Promise.all(reqs);
      const nextWeek = base.map((day, index) => {
        const r = results[index];
        return {
          ...day,
          count: r.total,
          cpuHosts: r.cpuHosts,
          memHosts: r.memHosts,
        };
      });
      const today = results[results.length - 1] || {};
      setCpuHosts(today.cpuHosts || []);
      setMemHosts(today.memHosts || []);
      setWeekData(nextWeek);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setWeekData(base);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWeekData();
  }, []);

  return isLoading ? (
    <Spin />
  ) : (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <div className={styles.card}>
          <Row style={{ height: '100%' }}>
            <Col span={12} className={styles['alert-card-line']}>
              <div className={styles.number}>{cpuHosts.length}</div>
              <div>{t('Today hosts with CPU usage > 80%')}</div>
              <HostList hosts={cpuHosts} />
            </Col>
            <Col span={12} className={styles['alert-card-line']}>
              <div className={styles.number}>{memHosts.length}</div>
              <div>{t('Today hosts with Memory usage > 80%')}</div>
              <HostList hosts={memHosts} />
            </Col>
          </Row>
        </div>
      </Col>
      <Col span={12}>
        <AlertChart data={weekData} />
      </Col>
    </Row>
  );
};

function HostList({ hosts = [] }) {
  if (!hosts.length) {
    return <div className={styles['alert-host-list']}>{t('None')}</div>;
  }
  return (
    <div className={styles['alert-host-list']} title={hosts.join('\n')}>
      {hosts.map((h) => shortHostLabel(h)).join(', ')}
    </div>
  );
}

function build7DaysData() {
  const today = moment().startOf('day');
  const ret = [];
  for (let index = 6; index >= 0; index--) {
    ret.push({
      fullDate: today.clone().subtract(index, 'day').format('YYYY-MM-DD'),
      date: today.clone().subtract(index, 'day').format('MM-DD'),
      count: 0,
      cpuHosts: [],
      memHosts: [],
    });
  }
  return ret;
}

function AlertChart({ data }) {
  return (
    <div className={styles.card}>
      <Row justify="space-between">
        <span>{t('Last week hosts over 80% (CPU + Memory)')}</span>
        <span>{t('hosts / day')}</span>
      </Row>
      <Row
        justify="center"
        align="middle"
        style={{ height: 272, paddingTop: 10 }}
      >
        {data.length === 0 ? <Empty /> : <Charts data={data} />}
      </Row>
    </div>
  );
}

function Charts({ data }) {
  return (
    <Chart
      padding={[10, 20, 50, 50]}
      autoFit
      data={data}
      scale={{
        count: {
          min: 0,
          nice: true,
          tickInterval: 1,
        },
      }}
    >
      <Line
        position="date*count"
        color={globalCSS.warnDarkColor || globalCSS.warnColor || '#FA8C16'}
      />
      <Tooltip showCrosshairs lock>
        {(title, items) => {
          const point = (items && items[0] && items[0].data) || {};
          const cpu = (point.cpuHosts || []).map(shortHostLabel);
          const mem = (point.memHosts || []).map(shortHostLabel);
          return (
            <div style={{ padding: 8, fontSize: 12, lineHeight: 1.5 }}>
              <div>
                <strong>{title}</strong>
                {`: ${point.count || 0} ${t('hosts')}`}
              </div>
              <div>
                {t('CPU')}: {cpu.length ? cpu.join(', ') : t('None')}
              </div>
              <div>
                {t('Memory')}: {mem.length ? mem.join(', ') : t('None')}
              </div>
            </div>
          );
        }}
      </Tooltip>
    </Chart>
  );
}

export default Index;
