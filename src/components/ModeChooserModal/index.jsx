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
import { Modal, Row, Col, Card } from 'antd';
import { AppstoreOutlined, RocketOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import {
  MODE_BASIC,
  MODE_ADVANCED,
  getConsoleMode,
  getHomePathForMode,
} from 'utils/console-mode';
import styles from './index.less';

// One-time modal that lets a fresh non-admin user pick their Skyline
// experience after login. Never shows for admins (they always work in
// Advanced) or for users who already picked a mode. Closing without a
// pick defaults them to Advanced.
export class ModeChooserModal extends Component {
  constructor(props) {
    super(props);
    // Dismissed = user clicked either card or the close button. Once
    // true we hide the modal locally so it doesn't pop back up.
    this.state = { dismissed: false };
  }

  // Visibility derives from live store state so it reacts as
  // hasAdminPageRole populates (updateUserRoles is async). Modal opens
  // for a non-admin authenticated user who hasn't yet picked a mode.
  get shouldShow() {
    if (this.state.dismissed) return false;
    const { rootStore } = this.props;
    if (!rootStore.user) return false;
    if (rootStore.hasAdminPageRole) return false;
    if (getConsoleMode()) return false;
    return true;
  }

  choose = (mode) => {
    const { rootStore } = this.props;
    rootStore.setConsoleMode(mode);
    this.setState({ dismissed: true });
    rootStore.routing.push(getHomePathForMode(mode));
  };

  // Close without picking → default to Advanced so the modal doesn't
  // reappear next login. Also mark as dismissed for this session.
  onClose = () => {
    const { rootStore } = this.props;
    if (!getConsoleMode()) {
      rootStore.setConsoleMode(MODE_ADVANCED);
    }
    this.setState({ dismissed: true });
  };

  renderCard({ mode, icon, title, description, cta }) {
    return (
      <Card
        className={styles.card}
        bordered={false}
        hoverable
        onClick={() => this.choose(mode)}
      >
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
        <div className={styles.cta}>{cta}</div>
      </Card>
    );
  }

  render() {
    return (
      <Modal
        open={this.shouldShow}
        onCancel={this.onClose}
        title={t('Choose your Skyline experience')}
        width={720}
        footer={null}
        maskClosable={false}
        destroyOnClose
        centered
      >
        <p className={styles.subheading}>
          {t(
            'Pick the console that fits how you work today. You can switch anytime from the header.'
          )}
        </p>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
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
          <Col xs={24} sm={12}>
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
      </Modal>
    );
  }
}

export default inject('rootStore')(observer(ModeChooserModal));
