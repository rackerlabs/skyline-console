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
import { Input, Button, Select, Row, Col } from 'antd';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { InfoCircleFilled } from '@ant-design/icons';
import SimpleForm from 'components/SimpleForm';
import SelectLang from 'components/SelectLang';
import globalSkylineStore from 'stores/skyline/skyline';
import globalMessageBannerStore from 'stores/skyline/message-banner';
import i18n from 'core/i18n';
import { isEmpty } from 'lodash';
import logo from 'asset/image/logo.png';
import { setLocalStorageItem } from 'utils/local-storage';
import styles from './index.less';

// Key used to remember that the active session was started via
// federation / SSO. Used by logout to redirect to the IdP logout URL
// instead of falling back to the local login page.
export const FEDERATION_LOGIN_KEY = 'is_federation_login';
// Origin of the Keystone host used for federation. Saved at SSO login
// time so the logout flow can build `{base}/Shibboleth.sso/Logout`
// even after most of local storage has been cleared.
export const FEDERATION_KEYSTONE_BASE_KEY = 'federation_keystone_base';
// Set on the SP-logout return URL. When the login page mounts with
// this query param it knows the SP session is dead and it should kick
// off the IdP logout step. We cannot chain SP -> IdP directly because
// mod_shib's `return=` allowlist blocks non-RP hosts.
const AFTER_LOGOUT_MARKER = 'afterLogout';
const AFTER_LOGOUT_VALUE_IDP = 'idp';
const IDP_LOGOUT_URL = 'https://login.rackspace.com/logout';

export class Login extends Component {
  constructor(props) {
    super(props);
    this.init();
    this.state = {
      error: false,
      message: '',
      loading: false,
      loginTypeOption: null,
    };
  }

  componentDidMount() {
    if (this.maybeFinishFederatedLogout()) {
      // The page is being navigated away to the IdP logout URL; skip
      // the rest of the bootstrap to avoid flashing the login form.
      return;
    }
    this.getRegions();
    this.getSSO();
    this.getUserDefaultDomain();
    this.fetchPublicBanners();
  }

  async getRegions() {
    await this.store.fetchRegionList();
    this.updateDefaultValue();
  }

  async getSSO() {
    try {
      await this.store.fetchSSO();
      const options = this.SSOOptions;
      if (options.length > 0) {
        this.setState({ loginTypeOption: options[0] });
      } else {
        this.setState({ loginTypeOption: this.passwordOption });
      }
    } catch (e) {
      console.log(e);
      this.setState({ loginTypeOption: this.passwordOption });
    }
  }

  async getUserDefaultDomain() {
    await this.store.fetchUserDefaultDomain();
  }

  get rootStore() {
    return this.props.rootStore;
  }

  get info() {
    const { info = {} } = this.rootStore;
    return info || {};
  }

  get productName() {
    const {
      product_name = {
        zh: t('The Rackspace Cloud'),
        en: 'The Rackspace Cloud',
      },
    } = this.info;
    const { getLocaleShortName } = i18n;
    const language = getLocaleShortName();
    const name =
      product_name[language] ||
      t('The Rackspace Cloud') ||
      'The Rackspace Cloud';
    return t('Welcome to {name}', { name });
  }

  get regions() {
    return (this.store.regions || []).map((it) => ({
      label: it,
      value: it,
    }));
  }

  get domains() {
    return [];
  }

  get nextPage() {
    const { location = {} } = this.props;
    const { search } = location;
    if (search) {
      return search.split('=')[1];
    }
    return '/base/overview';
  }

  get enableSSO() {
    const { sso: { enable_sso = false } = {} } = this.store;
    return enable_sso;
  }

  get ssoProtocols() {
    return {
      openid: t('OpenID Connect'),
    };
  }

  get SSOOptions() {
    if (!this.enableSSO) {
      return [];
    }
    const { sso: { protocols = [] } = {} } = this.store;
    return protocols.map((it) => {
      const { protocol, url } = it;
      return {
        label: this.ssoProtocols[protocol] || protocol,
        value: url,
        ...it,
      };
    });
    // if (SSOoptions.length > 0) {
    //   this.setState({ loginTypeOption: SSOoptions[0] });
    // }
  }

  get passwordOption() {
    return {
      label: t('Keystone Credentials'),
      value: 'password',
    };
  }

  get loginTypeOptions() {
    if (!this.enableSSO) {
      return [this.passwordOption];
    }
    return [...this.SSOOptions, this.passwordOption];
  }

  onLoginTypeChange = (value, option) => {
    this.setState({ loginTypeOption: option });
  };

  get currentLoginType() {
    const { loginTypeOption: { value } = {} } = this.state;
    if (value === 'password') {
      return 'password';
    }
    return 'sso';
  }

  get currentSSOLink() {
    const { loginTypeOption: { value } = {} } = this.state;
    return value;
  }

  get defaultValue() {
    const defaultLoginType = this.state.loginTypeOption?.value || 'password';
    const defaultRegion =
      this.regions.length === 1 ? this.regions[0].value : undefined;
    return {
      loginType: defaultLoginType,
      ...(defaultRegion && { region: defaultRegion }),
    };
  }

  get formItems() {
    const { error, loading } = this.state;
    // eslint-disable-next-line no-unused-vars
    const buttonProps = {
      block: true,
      type: 'primary',
    };
    const loginType = this.currentLoginType;
    const errorItem = {
      name: 'error',
      hidden: !error,
      render: () => (
        <div
          className={styles.loginError}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          id="login-error"
        >
          <InfoCircleFilled aria-hidden="true" />
          <span aria-label="Login error message">{this.getErrorMessage()}</span>
        </div>
      ),
    };
    const regionItem = {
      name: 'region',
      required: true,
      message: t('Please select your Region!'),
      render: () => (
        <Select
          placeholder={t('Select a region')}
          options={this.regions}
          aria-label={t('Select your region')}
          aria-required="true"
          aria-describedby={error ? 'login-error' : undefined}
        />
      ),
    };
    const domainItem = {
      name: 'domain',
      required: true,
      render: () => (
        <Input
          placeholder={t('<username> or <username>@<domain>')}
          aria-label={t('Username or username@domain')}
          aria-required="true"
          aria-describedby="domain-help login-error"
          autoComplete="username"
        />
      ),
      extra: (
        <span id="domain-help" role="note">
          {t(
            'Tips: If no domain is provided, the configured domain {domain} will be used.',
            { domain: this.store.userDefaultDomain || 'Default' }
          )}
        </span>
      ),
      rules: [{ required: true, validator: this.usernameDomainValidator }],
    };
    const usernameItem = {
      name: 'username',
      required: false,
      message: t('Please input your Username!'),
      render: () => <Input placeholder={t('Username')} />,
      hidden: true,
    };
    const passwordItem = {
      name: 'password',
      required: true,
      message: t('Please input your Password!'),
      render: () => (
        <Input.Password
          placeholder={t('Password')}
          aria-label={t('Password')}
          aria-required="true"
          aria-describedby={error ? 'login-error' : undefined}
          autoComplete="current-password"
        />
      ),
    };
    const extraItem = {
      name: 'extra',
      hidden: true,
      render: () => (
        <Row
          gutter={8}
          role="navigation"
          aria-label="Additional authentication options"
        >
          <Col span={12}>
            <Link
              to="password"
              aria-label={t('Reset your password if you forgot it')}
            >
              {t('Forgot your password?')}
            </Link>
          </Col>
          <Col span={12}>
            <Link
              to="register"
              className={styles.register}
              aria-label={t('Create a new account')}
            >
              {t('Sign up')}
            </Link>
          </Col>
        </Row>
      ),
    };
    const submitItem = {
      name: 'submit',
      render: () => (
        <Row gutter={8}>
          <Col span={12}>
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              {t('Log in')}
            </Button>
          </Col>
        </Row>
      ),
    };
    const namePasswordItems = [
      errorItem,
      regionItem,
      domainItem,
      usernameItem,
      passwordItem,
      extraItem,
    ];
    const typeItem = {
      name: 'loginType',
      required: true,
      message: t('Please select login type!'),
      extra: t(
        'If you are not sure which authentication method to use, please contact your administrator.'
      ),
      render: () => (
        <Select
          placeholder={t('Select a login type')}
          options={this.loginTypeOptions}
          onChange={this.onLoginTypeChange}
        />
      ),
    };
    if (this.enableSSO) {
      if (loginType === 'password') {
        return [typeItem, ...namePasswordItems, submitItem];
      }

      return [typeItem, submitItem];
    }
    return [...namePasswordItems, submitItem];
  }

  getUserId = (str) => str.split(':')[1].trim().split('.')[0];

  onLoginFailed = (error, values) => {
    this.setState({
      loading: false,
    });
    const {
      data: { detail = '' },
    } = error.response;
    const message = detail || '';
    if (
      message.includes(
        'The password is expired and needs to be changed for user'
      )
    ) {
      this.dealWithChangePassword(message, values);
    } else {
      this.setState({
        error: true,
        message,
      });
    }
  };

  onLoginSuccess = () => {
    this.setState({
      loading: false,
      error: false,
    });
    if (this.rootStore.user && !isEmpty(this.rootStore.user)) {
      this.rootStore.routing.push(this.nextPage);
    }
  };

  onFinish = (values) => {
    if (this.currentLoginType === 'sso') {
      // Mark this session as federated so logout can redirect to the
      // IdP logout URL. Also persist the Keystone host (origin of the
      // SSO URL) so logout can hit `{base}/Shibboleth.sso/Logout`
      // without hardcoding the environment.
      setLocalStorageItem(FEDERATION_LOGIN_KEY, true);
      let keystoneBase = '';
      try {
        const ssoUrl = this.currentSSOLink;
        if (ssoUrl) {
          keystoneBase = new URL(ssoUrl).origin;
          setLocalStorageItem(FEDERATION_KEYSTONE_BASE_KEY, keystoneBase);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('[login][sso] failed to derive keystone base', e);
      }
      // eslint-disable-next-line no-console
      console.log('[login][sso] saved federation markers', {
        FEDERATION_LOGIN_KEY,
        FEDERATION_KEYSTONE_BASE_KEY,
        ssoUrl: this.currentSSOLink,
        keystoneBase,
      });
      document.location.href = this.currentSSOLink;
      return;
    }
    this.setState({
      loading: true,
      message: '',
      error: false,
    });
    const { password, region, domain } = values;
    const usernameDomain = this.getUsernameAndDomain({
      usernameDomain: domain,
    });
    const body = { password, region, ...usernameDomain };
    this.rootStore.login(body).then(
      () => {
        this.onLoginSuccess();
      },
      (error) => {
        this.onLoginFailed(error, values);
      }
    );
  };

  getErrorMessage() {
    const { message } = this.state;
    if (message.includes('The account is locked for user')) {
      return t(
        'Frequent login failure will cause the account to be temporarily locked, please operate after 5 minutes'
      );
    }
    if (message.includes('The account is disabled for user')) {
      return t('The user has been disabled, please contact the administrator');
    }
    if (
      message.includes('You are not authorized for any projects or domains')
    ) {
      return t(
        'If you are not authorized to access any project, or if the project you are involved in has been deleted or disabled, contact the platform administrator to reassign the project'
      );
    }
    return t('Username or password is incorrect');
  }

  getUsernameAndDomain = (values) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { usernameDomain } = values;
    const trimmedUsernameDomain = usernameDomain.trim();
    let username;
    let domain;

    if (emailRegex.test(trimmedUsernameDomain)) {
      username = trimmedUsernameDomain;
      domain = this.store.userDefaultDomain || 'Default';
    } else {
      const lastAtIndex = trimmedUsernameDomain.lastIndexOf('@');
      username =
        lastAtIndex > 0
          ? trimmedUsernameDomain.slice(0, lastAtIndex)
          : trimmedUsernameDomain;
      domain =
        lastAtIndex > 0
          ? trimmedUsernameDomain.slice(lastAtIndex + 1)
          : this.store.userDefaultDomain || 'Default';
    }
    return {
      username,
      domain,
    };
  };

  get formItemsWithoutSubmit() {
    const items = this.formItems;
    return items.filter((item) => item.name !== 'submit');
  }

  handleSubmit = () => {
    if (this.formRef.current) {
      this.formRef.current.submit();
    }
  };

  usernameDomainValidator = (rule, value) => {
    if (!value || !value.trim()) {
      return Promise.reject(
        t('Please input <username> or <username>@<domain name>!')
      );
    }
    const tmp = value.trim().split('@');
    const message = t(
      'Please input the correct format:  <username> or <username>@<domain name>.'
    );
    if (tmp.length > 3) {
      return Promise.reject(new Error(message));
    }
    const { username, domain } = this.getUsernameAndDomain({
      usernameDomain: value,
    });
    if (!username || !domain) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  dealWithChangePassword = (detail, values) => {
    const userId = this.getUserId(detail);
    const data = {
      region: values.region,
      oldPassword: values.password,
      userId,
    };
    this.rootStore.setPasswordInfo(data);
    this.rootStore.routing.push('/auth/change-password');
  };

  updateDefaultValue = () => {
    if (this.formRef.current && this.formRef.current.resetFields) {
      this.formRef.current.resetFields();
    }
  };

  maybeFinishFederatedLogout() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get(AFTER_LOGOUT_MARKER) !== AFTER_LOGOUT_VALUE_IDP) {
        return false;
      }
      // Strip the marker so a back-button reload doesn't loop us.
      const cleanLogin = `${window.location.origin}/auth/login`;
      const target = `${IDP_LOGOUT_URL}?return=${encodeURIComponent(
        cleanLogin
      )}`;
      // eslint-disable-next-line no-console
      console.log('[login] SP session cleared, navigating to IdP logout', {
        target,
      });
      window.location.replace(target);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[login] post-logout redirect failed', e);
      return false;
    }
  }

  async fetchPublicBanners() {
    try {
      await globalMessageBannerStore.fetchPublic();
    } catch (e) {
      // no-op
    }
  }

  init() {
    this.store = globalSkylineStore;
    this.formRef = React.createRef();
  }

  renderExtra() {
    return null;
  }

  render() {
    const { loginTypeOption, loading } = this.state;
    if (!loginTypeOption) {
      return null;
    }

    // Determine if form is expanded (has many fields)
    const formItems = this.formItemsWithoutSubmit;
    const isExpanded = formItems.length > 3; // More than 3 fields = expanded
    const scrollableClass = `${styles.scrollableContent} ${
      isExpanded ? styles.expanded : ''
    }`;

    return (
      <>
        <div
          className={styles.loginContainer}
          role="article"
          aria-label="Login form container"
        >
          {/* Fixed header section - Logo only */}
          <div
            className={styles.headerSection}
            role="banner"
            aria-label="Application header"
          >
            <img
              alt="Application logo"
              className={styles.headerLogo}
              src={logo}
            />
          </div>

          {/* Language selector */}
          <div
            className={styles.langSelector}
            role="region"
            aria-label="Language selection"
          >
            <SelectLang />
          </div>

          {/* Scrollable content area */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className={scrollableClass}
            onKeyDown={(e) => e.key === 'Enter' && this.handleSubmit()}
          >
            <div role="main" aria-label="Login form content">
              <h1
                className={styles.welcomeMessage}
                id="login-title"
                aria-level="1"
              >
                {this.productName}
              </h1>

              <SimpleForm
                formItems={this.formItemsWithoutSubmit}
                name="normal_login"
                className={styles.loginForm}
                initialValues={this.defaultValue}
                onFinish={this.onFinish}
                formref={this.formRef}
                size="large"
                aria-labelledby="login-title"
                aria-describedby="login-description"
              />

              {/* renderExtra moved outside */}
            </div>
          </div>

          {/* Fixed bottom section */}
          <div
            className={styles.bottomSection}
            role="region"
            aria-label="Form submission section"
          >
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              className={styles.loginButton}
              size="large"
              block
              onClick={this.handleSubmit}
              aria-label={
                loading ? window.t('Logging in...') : window.t('Log in')
              }
              aria-describedby="login-title"
            >
              {window.t('Log in')}
            </Button>
          </div>
        </div>
        {this.renderExtra()}
      </>
    );
  }
}

export default inject('rootStore')(observer(Login));
