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
import { Layout, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';
import renderRoutes from 'utils/RouterConfig';
import GlobalHeader from 'components/Layout/GlobalHeader';
import NotFound from 'components/Cards/NotFound';
import styles from './index.less';

const { Header, Content } = Layout;

@inject('rootStore')
@observer
class Right extends Component {
  constructor(props) {
    super(props);
    this.routes = props.route.routes;
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  get isAdminPage() {
    return this.props.isAdminPage || false;
  }

  getUrl(path, adminStr) {
    return this.isAdminPage ? `${path}${adminStr || '-admin'}` : path;
  }

  checkHasTab = () => {
    const { currentRoutes } = this.props;
    if (currentRoutes.length === 0) {
      return false;
    }
    const { hasTab } = currentRoutes[currentRoutes.length - 1];
    return hasTab || false;
  };

  renderHeader = () => <GlobalHeader {...this.props} />;

  renderBreadcrumb = (currentRoutes) => {
    if (!currentRoutes || currentRoutes.length === 0) {
      return null;
    }
    const { hasBreadcrumb = true } = currentRoutes[currentRoutes.length - 1];
    if (!hasBreadcrumb && hasBreadcrumb !== undefined) {
      return null;
    }
    const items = currentRoutes.map((item, index) => {
      if (index === 0 || index === currentRoutes.length - 1) {
        return (
          <Breadcrumb.Item key={item.key} className={styles['breadcrumb-item']}>
            {item.name}
          </Breadcrumb.Item>
        );
      }
      return (
        <Breadcrumb.Item key={item.key}>
          <Link
            key={item.key}
            to={item.path}
            className={classnames(
              styles['breadcrumb-item'],
              styles['breadcrumb-link']
            )}
          >
            {item.name}
          </Link>
        </Breadcrumb.Item>
      );
    });
    if (items.length === 0) {
      return null;
    }
    const { hasTab } = currentRoutes[currentRoutes.length - 1];
    const tabClass = hasTab ? styles['breadcrumb-has-tab'] : '';
    return (
      <div className={`${styles.breadcrumb} ${tabClass}`}>
        <Breadcrumb>{items}</Breadcrumb>
      </div>
    );
  };

  renderChildren = (mainBreadcrubClass, mainTabClass, extraProps) => {
    const { hasError } = this.state;
    if (hasError) {
      return (
        <NotFound
          title={t('datas')}
          link={this.getUrl('/base/overview')}
          codeError
        />
      );
    }
    try {
      const { currentRoutes } = this.props;
      if (currentRoutes.length === 0) {
        return (
          <NotFound title={t('datas')} link={this.getUrl('/base/overview')} />
        );
      }
      const children = (
        <div className={`${styles.main} ${mainBreadcrubClass} ${mainTabClass}`}>
          {renderRoutes(this.routes, extraProps)}
        </div>
      );
      return children;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return (
        <NotFound
          title={t('datas')}
          link={this.getUrl('/base/overview')}
          codeError
        />
      );
    }
  };

  render() {
    const { pathname } = this.props.location;
    const { collapsed, currentRoutes, isAdminPage = false } = this.props;

    const breadcrumb = this.renderBreadcrumb(currentRoutes);
    const hasBreadcrumb = breadcrumb !== null;
    const { user } = this.props.rootStore;
    const hasTab = this.checkHasTab(pathname);
    const mainBreadcrubClass = hasBreadcrumb
      ? ''
      : styles['main-no-breadcrumb'];
    const mainTabClass = hasTab ? styles['main-has-tab'] : '';
    const extraProps = {
      // sliderHover: hover,
      sliderCollapsed: collapsed,
      isAdminPage,
    };
    const children = user
      ? this.renderChildren(mainBreadcrubClass, mainTabClass, extraProps)
      : null;

    return (
      <Layout
        className={classnames(
          styles['base-layout-right'],
          collapsed ? styles['base-layout-right-collapsed'] : ''
        )}
      >
        <Header className={styles.header}>{this.renderHeader()}</Header>
        <Content className={styles.content}>
          {breadcrumb}
          {children}
        </Content>
      </Layout>
    );
  }
}

export default Right;