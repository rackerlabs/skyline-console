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
import { inject, observer } from 'mobx-react';
import { Card, Col, Row, Button } from 'antd';
import { AppstoreOutlined, RocketOutlined } from '@ant-design/icons';
import {
  MODE_BASIC,
  MODE_ADVANCED,
  getHomePathForMode,
} from 'utils/console-mode';
import styles from './index.less';

export class ModeSelect extends Component {
  handleSelect = (mode) => {
    this.props.rootStore.setConsoleMode(mode);
    const target = getHomePathForMode(mode);
    this.props.rootStore.routing.push(target);
  };

  renderCard({ mode, icon, title, description, cta }) {
    return (
      <Card
        className={styles.card}
        bordered={false}
        hoverable
        onClick={() => this.handleSelect(mode)}
      >
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
        <Button
          type="primary"
          size="large"
          className={styles.cta}
          onClick={(e) => {
            e.stopPropagation();
            this.handleSelect(mode);
          }}
        >
          {cta}
        </Button>
      </Card>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>{t('Choose your experience')}</h1>
          <p className={styles.subheading}>
            {t(
              'Pick the console that fits how you work today. You can switch anytime from the header.'
            )}
          </p>
        </div>
        <Row gutter={[24, 24]} justify="center" className={styles.cards}>
          <Col xs={24} sm={20} md={10} lg={9}>
            {this.renderCard({
              mode: MODE_BASIC,
              icon: <AppstoreOutlined />,
              title: t('Basic'),
              description: t(
                'A streamlined view with the essentials. Great for everyday tasks and getting started quickly.'
              ),
              cta: t('Use Basic'),
            })}
          </Col>
          <Col xs={24} sm={20} md={10} lg={9}>
            {this.renderCard({
              mode: MODE_ADVANCED,
              icon: <RocketOutlined />,
              title: t('Advanced'),
              description: t(
                'The full Skyline console with every service, resource, and control available.'
              ),
              cta: t('Use Advanced'),
            })}
          </Col>
        </Row>
      </div>
    );
  }
}

export default inject('rootStore')(observer(ModeSelect));
