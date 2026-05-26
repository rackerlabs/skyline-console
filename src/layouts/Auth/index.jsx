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
import { Tag } from 'antd';
import { BellOutlined, ToolOutlined } from '@ant-design/icons';
import renderRoutes from 'utils/RouterConfig';
import globalMessageBannerStore from 'stores/skyline/message-banner';
import { getMessageTypeLabel } from 'resources/skyline/message-banner';

import loginFullImageWebp from 'asset/image/login-full.webp';
import loginFullImagePng from 'asset/image/login-full.png';
// import genestackLogo from 'asset/image/genestackLogo.png';
import openstackLogoWebp from 'asset/image/openstack-new-logo.webp';
import openstackLogoPng from 'asset/image/openstack-new-logo.png';
import styles from './index.less';

export class AuthLayout extends Component {
  constructor(props) {
    super(props);
    this.routes = props.route.routes;
    this.state = { backgroundLoaded: false, currentSlide: 0 };
  }

  componentDidMount() {
    globalMessageBannerStore.fetchPublic().catch(() => {});
    this.autoSlideTimer = setInterval(() => {
      if (this.paused) return;
      const banners = globalMessageBannerStore.publicBanners || [];
      if (banners.length > 1) {
        this.setState((prevState) => ({
          currentSlide: ((prevState.currentSlide || 0) + 1) % banners.length,
        }));
      }
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.autoSlideTimer);
  }

  markBackgroundLoaded = () => {
    if (!this.state.backgroundLoaded) {
      this.setState({ backgroundLoaded: true });
    }
  };

  handleBackgroundImageRef = (img) => {
    if (img?.complete) this.markBackgroundLoaded();
  };

  renderPublicBanners() {
    const banners = globalMessageBannerStore.publicBanners || [];
    if (!banners.length) {
      return null;
    }
    const currentSlide = this.state.currentSlide || 0;
    const banner = banners[currentSlide];
    return (
      <div className={styles.publicBanners}>
        <div
          className={styles.publicBannerCard}
          onMouseEnter={() => {
            this.paused = true;
          }}
          onMouseLeave={() => {
            this.paused = false;
          }}
        >
          <div className={styles.publicBannerContent}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 3,
              }}
            >
              {banner.type === 'maintenance' ? (
                <ToolOutlined style={{ fontSize: 12, color: '#666' }} />
              ) : (
                <BellOutlined style={{ fontSize: 12, color: '#666' }} />
              )}
              <Tag
                color={banner.type === 'maintenance' ? 'blue' : 'orange'}
                style={{ fontSize: 10, margin: 0 }}
              >
                {getMessageTypeLabel(banner.type)}
              </Tag>
            </div>
            <div className={styles.publicBannerItemTitle}>
              {banner.title || '-'}
            </div>
            <div className={styles.publicBannerMessage}>{banner.message}</div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { backgroundLoaded } = this.state;

    return (
      <div
        className={styles.container}
        role="main"
        aria-label="Authentication page"
      >
        {/* Full-screen background */}
        <div
          className={styles.background}
          role="presentation"
          aria-hidden="true"
        >
          <picture>
            <source srcSet={loginFullImageWebp} type="image/webp" />
            <img
              ref={this.handleBackgroundImageRef}
              alt=""
              className={styles.backgroundImage}
              src={loginFullImagePng}
              onLoad={this.markBackgroundLoaded}
              onError={this.markBackgroundLoaded}
              aria-hidden="true"
            />
          </picture>
          <div className={styles.overlay} aria-hidden="true" />
        </div>

        {/* Left column - Login content */}
        <div
          className={styles.leftColumn}
          role="region"
          aria-label="Login form section"
        >
          <div
            className={styles.cardContainer}
            role="form"
            aria-label="User authentication form"
          >
            {renderRoutes(this.routes)}
          </div>
        </div>

        {/* Right column - Logo and branding */}
        <div
          className={`${styles.rightColumn} ${
            backgroundLoaded ? styles.visible : ''
          }`}
          role="region"
          aria-label="Branding section"
        >
          <div
            className={styles.brandingContainer}
            role="banner"
            aria-labelledby="brand-title"
          >
            <picture>
              <source srcSet={openstackLogoWebp} type="image/webp" />
              <img
                alt="Rackspace OpenStack logo"
                className={styles.logo}
                src={openstackLogoPng}
              />
            </picture>
            <h2
              id="brand-title"
              className={styles.brandTitle}
              aria-label="Rackspace OpenStack platform"
            >
              Rackspace OpenStack
            </h2>
            <p className={styles.brandSubtitle} aria-describedby="brand-title">
              Powered by openCenter
            </p>
          </div>
        </div>
        {this.renderPublicBanners()}
      </div>
    );
  }
}

export default inject('rootStore')(observer(AuthLayout));
