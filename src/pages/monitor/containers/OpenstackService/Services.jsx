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
import { Col, Collapse, List, Tooltip } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './index.less';

const { Panel } = Collapse;

function renderStatus(state) {
  const isDisabled = state === 'disabled';
  const isDown = state === 'down';
  const color = isDisabled
    ? globalCSS.warnDarkColor || '#FA8C16'
    : isDown
    ? globalCSS.errorColor
    : '#22754a';
  const title = isDisabled ? t('Disabled') : isDown ? t('Down') : t('Up');
  const style = { fontSize: 24, marginLeft: 36, color };
  return (
    <Tooltip title={title}>
      <span>
        {isDown || isDisabled ? (
          <InfoCircleOutlined style={style} />
        ) : (
          <CheckCircleOutlined style={style} />
        )}
      </span>
    </Tooltip>
  );
}

const Services = (props) => {
  const { serviceMap } = props;
  return (
    <Collapse defaultActiveKey={serviceMap.map((item) => item.key)} ghost>
      {serviceMap.map((item) => (
        <Panel
          header={<span className={styles.header}>{item.title}</span>}
          key={item.key}
        >
          <List
            bordered
            dataSource={item.data}
            className={styles.list}
            loading={item.isLoading}
            renderItem={(it) => (
              <List.Item className={styles.item}>
                <Col className={styles.title} span={5}>
                  {it.engine_id ? (
                    <Tooltip title={it.engine_id}>
                      <span>{it.serviceName}</span>
                    </Tooltip>
                  ) : (
                    it.serviceName
                  )}
                </Col>
                <Col className={styles.title} span={9}>
                  <div>{it.hostname || it.host}</div>
                  {it.instance && (
                    <div className={styles.instance}>{it.instance}</div>
                  )}
                </Col>
                <Col className={styles.status} span={5}>
                  <span>{t('Current Status')}</span>
                  {renderStatus(it.state)}
                </Col>
                <Col className={styles.status} span={5}>
                  <span>{t('Last 24H Status')} </span>
                  {renderStatus(it[`${it.serviceName}24`] || 'up')}
                </Col>
              </List.Item>
            )}
          />
        </Panel>
      ))}
    </Collapse>
  );
};

export default Services;
