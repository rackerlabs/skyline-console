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
import PropTypes from 'prop-types';
import { Row, Col, Card, Descriptions } from 'antd';
import { inject, observer } from 'mobx-react';
import {
  AppstoreAddOutlined,
  UserOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styles from '../style.less';

export const actions = [
  {
    key: 'projectNum',
    label: t('Projects'),
    avatar: <AppstoreAddOutlined />,
    color: '#000000',
    to: '/identity/project-admin',
  },
  {
    key: 'userNum',
    label: t('Users'),
    avatar: <UserOutlined />,
    color: '#000000',
    to: '/identity/user-admin',
  },
  {
    key: 'nodeNum',
    label: t('Nodes'),
    avatar: <DatabaseOutlined />,
    color: '#000000',
    to: '/compute/hypervisors-admin?tab=ComputeHost',
  },
];

export class ProjectInfo extends Component {
  componentDidMount() {
    this.props.store.getProjectInfoData();
  }

  get actions() {
    return this.props.actions || actions;
  }

  render() {
    const { projectInfoLoading, platformNum } = this.props.store;
    return (
      <Card
        loading={projectInfoLoading}
        className={styles.project}
        title={t('Platform Info')}
        bordered={false}
      >
        <Descriptions column={1}>
          <div className={styles['platform-grid']}>
            <Row gutter={[16, 16]} align="middle">
              {this.actions.map((item) => (
                <Col xs={8} sm={8} md={8} key={item.key}>
                  <Link
                    to={item.to}
                    style={{ color: item.color }}
                    className={styles['platform-link']}
                  >
                    <span className={styles['platform-value']}>
                      {platformNum[item.key]}
                    </span>
                    <span className={styles['platform-label']}>
                      {item.avatar} {item.label}
                    </span>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        </Descriptions>
      </Card>
    );
  }
}

ProjectInfo.propTypes = {
  store: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(ProjectInfo));
