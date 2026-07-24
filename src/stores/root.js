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

import { action, observable, extendObservable } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import { parse } from 'qs';
import client from 'client';
import { getQueryString } from 'utils/index';
import {
  setLocalStorageItem,
  getLocalStorageItem,
  clearLocalStorage,
} from 'utils/local-storage';
import {
  getConsoleMode,
  setConsoleMode as persistConsoleMode,
  isValidMode,
  MODE_ADVANCED,
} from 'utils/console-mode';
import { isEmpty, values } from 'lodash';

// Keys written by the Login page on SSO sign-in. Kept dynamic so the
// logout chain works on any environment (dev, staging, prod) without
// hardcoded hosts.
const FEDERATION_LOGIN_KEY = 'is_federation_login';
const FEDERATION_KEYSTONE_BASE_KEY = 'federation_keystone_base';
// IdP logout endpoint used as the second hop of federated logout. The
// SP (Apache mod_shib) won't allow `return=` URLs outside its own
// allowlist, so we can't chain straight to the IdP from
// /Shibboleth.sso/Logout. Instead, the SP returns to Skyline with an
// `afterLogout=idp` marker, and the login page navigates here itself.
// const IDP_LOGOUT_URL = 'https://login.rackspace.com/logout';
// Query marker the login page reads to know it should perform the
// final IdP logout hop after the SP has cleared its session.
const AFTER_LOGOUT_MARKER = 'afterLogout=idp';

const buildSpLogoutUrl = (keystoneBase, skylineOrigin) => {
  // SP logout's `return=` must point at Skyline (the relying party).
  // Anything else (e.g. the IdP host) gets blocked by mod_shib's
  // redirect allowlist with `opensaml::SecurityPolicyException`.
  const ksBase = String(keystoneBase).replace(/\/+$/, '');
  const skylineReturn = `${skylineOrigin.replace(
    /\/+$/,
    ''
  )}/auth/login?${AFTER_LOGOUT_MARKER}`;
  return `${ksBase}/Shibboleth.sso/Logout?return=${encodeURIComponent(
    skylineReturn
  )}`;
};

export class RootStore {
  @observable
  user = null;

  @observable
  projectId = null;

  @observable
  projectName = null;

  @observable
  roles = [];

  @observable
  baseDomains = [];

  @observable
  policies = [];

  @observable
  hasAdminRole = false;

  @observable
  hasAdminPageRole = false;

  @observable
  hasAdminOnlyRole = false;

  @observable
  openKeys = [];

  @observable
  endpoints = {};

  @observable
  oldPassword = {};

  @observable
  info = {};

  @observable
  version = '';

  @observable
  noticeCount = 0;

  noticeCountWaitRemove = 0;

  @observable
  enableBilling = false;

  @observable
  neutronExtensions = [];

  // Basic / Advanced console mode. Kept as an observable so the header
  // toggle can flip the value and the Base layout re-renders with the
  // right menu. Source of truth remains localStorage (see
  // `utils/console-mode`); this field mirrors it for reactivity.
  @observable
  consoleMode = getConsoleMode() || MODE_ADVANCED;

  // @observable
  // menu = renderMenu(i18n.t);

  constructor() {
    this.routing = new RouterStore();
    this.routing.query = this.query;
    global.navigateTo = this.routing.push;
  }

  @action
  setConsoleMode(mode) {
    if (!isValidMode(mode)) {
      return;
    }
    this.consoleMode = mode;
    persistConsoleMode(mode);
  }

  get client() {
    return client.skyline;
  }

  register(name, store) {
    extendObservable(this, { [name]: store });
  }

  query = (params = {}, refresh = false) => {
    const { pathname, search } = this.routing.location;
    const currentParams = parse(search.slice(1));

    const newParams = refresh ? params : { ...currentParams, ...params };
    this.routing.push(`${pathname}?${getQueryString(newParams)}`);
  };

  setKeystoneToken(result) {
    const { keystone_token } = result || {};
    setLocalStorageItem('keystone_token', keystone_token);
  }

  @action
  async login(params) {
    const result = await this.client.login(params);
    this.setKeystoneToken(result);
    return this.getUserProfileAndPolicy();
  }

  async getUserSystemRoles(user) {
    // only scope system roles has admin/reader can go to administrator
    const { id } = user;
    try {
      const result = await client.keystone.systemUsers.roles.list(id);
      const { roles = [] } = result;
      return roles.some((it) => it.name === 'admin' || it.name === 'reader');
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  @action
  async updateUserRoles(user) {
    const { roles = [], base_domains, user: userInfo = {} } = user || {};
    this.roles = roles;
    this.baseDomains = base_domains;
    const hasSystemAdminRole = await this.getUserSystemRoles(userInfo);
    const hasProjectAdminRole = roles.some((it) => it.name === 'admin');
    this.hasAdminPageRole = hasSystemAdminRole || hasProjectAdminRole;
    this.hasAdminRole = this.hasAdminPageRole;
    this.hasAdminOnlyRole = roles.some((it) => it.name === 'admin');
  }

  @action
  updateUser(user, policies) {
    this.user = user;
    this.policies = policies;
    const {
      endpoints = {},
      version = '',
      project: { id: projectId, name: projectName } = {},
    } = user || {};
    this.projectId = projectId;
    this.projectName = projectName;
    this.version = version;
    this.endpoints = endpoints;
    this.updateUserRoles(user);
    this.setKeystoneToken(user);
  }

  checkEndpoint(key) {
    if (!key) {
      return true;
    }
    return !!this.endpoints[key];
  }

  @action
  async getUserProfileAndPolicy() {
    const [profile, policies] = await Promise.all([
      this.client.profile(),
      this.client.policies.list(),
    ]);
    await this.updateUser(profile, policies.policies || []);
    return this.getNeutronExtensions();
  }

  @action
  async getNeutronExtensions() {
    try {
      const { extensions } = await client.neutron.extensions.list();
      this.neutronExtensions = extensions;
    } catch (error) {
      this.neutronExtensions = [];
    }
  }

  @action
  async logout() {
    // Capture federation state before clearData() wipes local storage.
    const isFederated = !!getLocalStorageItem(FEDERATION_LOGIN_KEY);
    const keystoneBase = getLocalStorageItem(FEDERATION_KEYSTONE_BASE_KEY);
    // eslint-disable-next-line no-console
    console.log('[logout] read federation markers', {
      FEDERATION_LOGIN_KEY,
      FEDERATION_KEYSTONE_BASE_KEY,
      isFederated,
      keystoneBase,
    });

    // Always call /logout so Skyline clears its own session/token state
    // and revokes the Keystone token, regardless of login type.
    await this.client.logout();
    this.clearData();
    this.user = null;
    this.policies = [];
    this.roles = [];
    this.hasAdminRole = false;
    this.hasAdminPageRole = false;
    this.version = '';
    this.noticeCount = 0;
    this.noticeCountWaitRemove = 0;

    if (isFederated && keystoneBase) {
      // Federated sessions: tear down the SP session at Keystone first,
      // bouncing back to Skyline's login page. The login page will
      // then perform the IdP logout step. We can't chain SP -> IdP
      // directly because the SP only allows `return=` URLs that point
      // at the relying party (Skyline).
      const target = buildSpLogoutUrl(keystoneBase, window.location.origin);
      // eslint-disable-next-line no-console
      console.log('[logout] federated session, redirecting to SP logout', {
        target,
      });
      window.location.href = target;
      return;
    }

    // Non-federated (Keystone) sessions keep the original behavior:
    // back to the local login page.
    this.goToLoginPage();
  }

  @action
  goToLoginPage(currentPath, refresh) {
    if (currentPath) {
      this.routing.push(`/auth/login?referer=${currentPath}`);
    } else {
      this.routing.push('/auth/login');
    }
    if (refresh) {
      window.location.reload();
    }
  }

  @action
  updateOpenKeys(newKeys) {
    this.openKeys = newKeys;
  }

  @action
  async switchProject(projectId, domainId) {
    this.user = null;
    const result = await this.client.switchProject(projectId, domainId);
    this.clearData();
    this.setKeystoneToken(result);
    return this.getUserProfileAndPolicy();
  }

  @action
  async setPasswordInfo(data) {
    this.oldPassword = data;
    if (!data || isEmpty(data)) {
      return;
    }
    const { region } = data;
    const res = await this.client.contrib.keystoneEndpoints();
    const regionInfo = res.find((it) => it.region_name === region);
    const endpoints = {
      keystone: regionInfo.url,
    };
    this.endpoints = endpoints;
  }

  @action
  addNoticeCount() {
    this.noticeCount += 1;
  }

  @action
  removeNoticeCount() {
    const elements = document.getElementsByClassName('ant-modal');
    // if there is an modal in the page, the notice count will be changed later, after no modal.
    if (elements.length > 0) {
      this.noticeCountWaitRemove += 1;
    } else {
      const noticeCount = this.noticeCount - 1 - this.noticeCountWaitRemove;
      this.noticeCount = noticeCount < 0 ? 0 : noticeCount;
      this.noticeCountWaitRemove = 0;
    }
  }

  @action
  clearNoticeCount() {
    this.noticeCount = 0;
    this.noticeCountWaitRemove = 0;
  }

  clearData() {
    // global stores need to be clear data when change auth
    const allGlobalStores = require('./index').default;
    const stores = values(allGlobalStores);
    stores.forEach((store) => {
      store.clearData();
    });
    // clear all local storage expect language
    clearLocalStorage(['lang']);
    // Reset the in-memory console mode to Advanced so the next user
    // starts fresh. The chooser page will overwrite this on selection.
    this.consoleMode = MODE_ADVANCED;
  }
}

const globalRootStore = new RootStore();
export default globalRootStore;
