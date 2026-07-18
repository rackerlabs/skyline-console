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
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Row, Col, Tooltip, Card } from 'antd';
import {
  QuestionCircleOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import ProjectInfo from 'pages/base/containers/Overview/components/ProjectInfo';
import MessageBannerPanel from 'pages/base/containers/Overview/components/MessageBannerPanel';
import BasicQuotaOverview from './BasicQuotaOverview';
import styles from './index.less';

// Quota categories shown on the Basic home. Deliberately narrower
// than the Advanced Overview: Compute (Instances, Memory, vCPUs, Key
// Pairs), Storage (Volumes, Volume Capacity), Network (Networks,
// Subnets, Floating IPs, Ports, Security Groups).
const basicQuotaCardList = [
  {
    text: t('Compute'),
    type: 'compute',
    value: [
      { text: t('Instances'), key: 'instances' },
      { text: t('Memory (GiB)'), key: 'ram' },
      { text: t('vCPUs'), key: 'cores' },
      {
        text: (
          <span>
            {t('Key Pairs')}
            <Tooltip
              title={t('The number of allowed key pairs for each user.')}
            >
              <QuestionCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </span>
        ),
        key: 'key_pairs',
      },
    ],
  },
  {
    text: t('Storage'),
    type: 'storage',
    value: [
      { text: t('Volumes'), key: 'volumes' },
      { text: t('Volume Capacity (GiB)'), key: 'gigabytes' },
    ],
  },
  {
    text: t('Network'),
    type: 'networks',
    value: [
      { text: t('Networks'), key: 'network' },
      { text: t('Subnets'), key: 'subnet' },
      { text: t('Floating IPs'), key: 'floatingip' },
      { text: t('Ports'), key: 'port' },
      { text: t('Security Groups'), key: 'security_group' },
    ],
  },
];

const shortcuts = [
  {
    key: 'instance',
    label: t('Create Instance'),
    icon: <DesktopOutlined />,
    to: '/basic/compute/instance/create',
  },
  {
    key: 'volume',
    label: t('Create Volume'),
    icon: <DatabaseOutlined />,
    to: '/basic/storage/volume/create',
  },
  {
    key: 'network',
    label: t('Create Network'),
    icon: <GlobalOutlined />,
    to: '/basic/network/network/create',
  },
];

export class BasicHome extends Component {
  renderShortcuts() {
    return (
      <Row gutter={[16, 16]} className={styles.shortcuts}>
        {shortcuts.map((it) => (
          <Col xs={24} sm={8} key={it.key}>
            <Link to={it.to} className={styles['shortcut-link']}>
              <Card className={styles.shortcut} bordered={false} hoverable>
                <span className={styles['shortcut-icon']}>{it.icon}</span>
                <span className={styles['shortcut-label']}>{it.label}</span>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        {this.renderShortcuts()}
        <Row gutter={16}>
          <Col xs={24} lg={16} className={styles.left}>
            <BasicQuotaOverview quotaCardList={basicQuotaCardList} />
          </Col>
          <Col xs={24} lg={8} className={styles.right}>
            <ProjectInfo />
            <MessageBannerPanel />
          </Col>
        </Row>
      </div>
    );
  }
}

export default observer(BasicHome);
