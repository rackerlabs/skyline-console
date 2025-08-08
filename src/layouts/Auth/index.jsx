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
import renderRoutes from 'utils/RouterConfig';

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
  }

  render() {
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
              alt=""
              className={styles.backgroundImage}
              src={loginFullImagePng}
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
          className={styles.rightColumn}
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
      </div>
    );
  }
}

export default inject('rootStore')(observer(AuthLayout));
