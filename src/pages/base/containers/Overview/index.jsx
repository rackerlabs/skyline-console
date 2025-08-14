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
import { Row, Col, Modal } from 'antd';
import overviewInstance from 'asset/image/overview-instance.svg';
import overviewNetwork from 'asset/image/overview-network.svg';
import overviewRouter from 'asset/image/overview-router.svg';
import overviewVolume from 'asset/image/overview-volume.svg';
import quickStartNetwork from 'asset/image/quick-start-network.svg';
import { Link } from 'react-router-dom';
import globalRootStore from 'stores/root';
import styles from './style.less';
import QuotaOverview from './components/QuotaOverview';
import ProjectInfo from './components/ProjectInfo';
import QuickStartNetwork from './components/QuickStartNetwork';

const actions = [
  {
    key: 'instance',
    label: t('Instances'),
    avatar: overviewInstance,
    to: '/compute/instance',
  },
  {
    key: 'volume',
    label: t('Volumes'),
    avatar: overviewVolume,
    to: '/storage/volume',
  },
  {
    key: 'network-quick-start',
    label: t('QuickNet'),
    avatar: quickStartNetwork,
    isQuickStart: true,
  },
  {
    key: 'network',
    label: t('Networks'),
    avatar: overviewNetwork,
    to: '/network/networks',
  },
  {
    key: 'router',
    label: t('Routers'),
    avatar: overviewRouter,
    to: '/network/router',
  },
];

export class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showQuickStartModal: false,
    };
    this.submitFormCallback = null;
  }

  get filterActions() {
    if (!globalRootStore.checkEndpoint('cinder')) {
      return actions.filter((it) => it.key !== 'volume');
    }
    return actions;
  }

  get span() {
    if (!globalRootStore.checkEndpoint('cinder')) {
      return 8;
    }
    return 6;
  }

  handleQuickStart = () => {
    this.setState({ showQuickStartModal: true });
  };

  handleModalOk = () => {
    if (this.submitFormCallback) {
      this.submitFormCallback();
    }
  };

  handleModalCancel = () => {
    this.setState({ showQuickStartModal: false });
  };

  setSubmitFormCallback = (callback) => {
    this.submitFormCallback = callback;
  };

  renderAction = (item) => (
    <Row className={styles['action-button']}>
      <Col span={8} className={styles['main-icon']}>
        <img alt="avatar" src={item.avatar} className={styles['action-icon']} />
      </Col>
      <Col
        span={16}
        className={styles['action-label']}
        style={{ textAlign: 'center' }}
      >
        {item.label}
      </Col>
    </Row>
  );

  renderActions() {
    return this.filterActions.map((item) => {
      const actionContent = this.renderAction(item);
      return (
        <Col span={this.span} key={item.key}>
          {item.isQuickStart ? (
            <div onClick={this.handleQuickStart} style={{ cursor: 'pointer' }}>
              {actionContent}
            </div>
          ) : (
            <Link to={item.to}>{actionContent}</Link>
          )}
        </Col>
      );
    });
  }

  renderQuota() {
    return <QuotaOverview />;
  }

  renderProject() {
    return <ProjectInfo />;
  }

  renderExtra() {
    return null;
  }

  render() {
    const { showQuickStartModal } = this.state;

    return (
      <div className={styles.container}>
        <Row
          justify="space-between"
          gutter={16}
          style={{ marginBottom: '16px' }}
        >
          {this.renderActions()}
        </Row>
        <Row gutter={16}>
          <Col span={16} className={styles.left}>
            {this.renderQuota()}
          </Col>
          <Col span={8} className={styles.right}>
            {this.renderProject()}
            {this.renderExtra()}
          </Col>
        </Row>
        <Modal
          open={showQuickStartModal}
          onCancel={this.handleModalCancel}
          onOk={this.handleModalOk}
          title={t('Network Quick Start')}
          destroyOnClose
          centered
          width={600}
        >
          <QuickStartNetwork
            onCancel={this.handleModalCancel}
            setSubmitFormCallback={this.setSubmitFormCallback}
          />
        </Modal>
      </div>
    );
  }
}

export default observer(Overview);
