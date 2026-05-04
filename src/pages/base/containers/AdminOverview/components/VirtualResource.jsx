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

import React, { Component } from 'react';
import { Row, Col, Card, Descriptions, Progress, Avatar } from 'antd';
import { inject, observer } from 'mobx-react';
import styles from '../style.less';

export const resourceCircle = [
  {
    resource: 'vcpus',
    used: 'vcpus_used',
    label: t('CPU Usages (Core)'),
  },
  {
    resource: 'memory_mb',
    used: 'memory_mb_used',
    label: t('Memory Usages (GiB)'),
  },
];

export const color = {
  infoColor: globalCSS.normalColor,
  warnColor: globalCSS.warnDarkColor,
  dangerColor: globalCSS.errorColor,
};

export class ResourceCircle extends Component {
  componentDidMount() {
    this.props.store.getVirtualResource();
  }

  get circleWidth() {
    if (typeof window === 'undefined') {
      return 150;
    }
    const viewportWidth = window.innerWidth || 1440;
    if (viewportWidth <= 480) {
      return 108;
    }
    if (viewportWidth <= 768) {
      return 124;
    }
    if (viewportWidth <= 1200) {
      return 136;
    }
    return 150;
  }

  get resourceCircle() {
    return this.props.resourceCircle || resourceCircle;
  }

  get resourceCircleSpan() {
    return this.props.resourceCircleSpan || 12;
  }

  renderCircle = (item, index) => {
    const { overview } = this.props.store;
    const resource = overview[item.resource];

    const used = overview[item.used];
    const percentNum = parseFloat(((used / resource) * 100).toFixed(2));
    const unUsed = parseFloat((resource - used).toFixed(2));
    let circleColor = color.infoColor;
    if (percentNum > 70) {
      circleColor = color.warnColor;
    }
    if (percentNum > 90) {
      circleColor = color.dangerColor;
    }
    return (
      <Col
        xs={24}
        sm={12}
        md={12}
        lg={this.resourceCircleSpan}
        xl={this.resourceCircleSpan}
        className={styles['resource-circle-col']}
        key={`${resource}-${index}`}
      >
        <div className={styles['resource-circle-card']}>
          <span className={styles['resource-circle-label']}>{item.label}</span>
          <div className={styles['resource-circle-progress']}>
            <Progress
              type="circle"
              width={this.circleWidth}
              percent={percentNum}
              strokeColor={circleColor}
              format={(percent) => `${percent}%`}
            />
          </div>
          <Row className={styles['resource-circle-meta']} gutter={[12, 8]}>
            <Col span={12} className={styles['resource-circle-meta-item']}>
              <Avatar
                shape="square"
                size={15}
                style={{
                  marginBottom: 2,
                  marginRight: 2,
                  backgroundColor: circleColor,
                }}
              />
              <span className={styles['resource-circle-meta-text']}>
                <span>{`${t('Used')}:`}</span>
                <span>{used}</span>
              </span>
            </Col>
            <Col span={12} className={styles['resource-circle-meta-item']}>
              <Avatar
                shape="square"
                size={15}
                style={{
                  marginBottom: 2,
                  marginRight: 2,
                  backgroundColor: '#A3A3A3',
                }}
              />
              <span className={styles['resource-circle-meta-text']}>
                <span>{`${t('Available')}:`}</span>
                <span>{unUsed > 0 ? unUsed : '0'}</span>
              </span>
            </Col>
          </Row>
        </div>
      </Col>
    );
  };

  render() {
    const { isLoading } = this.props.store;
    return (
      <Card
        loading={isLoading}
        className={styles.chart}
        title={t('Virtual Resources Used')}
        bordered={false}
      >
        <Descriptions column={1}>
          <div className="site-card-wrapper">
            <Row gutter={16}>
              {this.resourceCircle.map((item, index) => {
                return this.renderCircle(item, index);
              })}
            </Row>
          </div>
        </Descriptions>
      </Card>
    );
  }
}

export default inject('rootStore')(observer(ResourceCircle));
