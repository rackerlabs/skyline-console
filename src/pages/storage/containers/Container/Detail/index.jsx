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

import React, { useEffect, useState } from 'react';
import { observer, inject } from 'mobx-react';
import { Popover, Col, Row, Skeleton, Button, message } from 'antd';
import Base from 'containers/List';
import globalObjectStore, { ObjectStore } from 'stores/swift/object';
import { ContainerStore } from 'stores/swift/container';
import { bytesFilter } from 'utils/index';
import { allCanReadPolicy } from 'resources/skyline/policy';
import { toJS } from 'mobx';
import { isEqual } from 'lodash';
import { isFolder } from 'resources/swift/container';
import { getStrFromTimestamp } from 'utils/time';
import styles from './index.less';
import actionConfigs from './actions';
import CDNUrl from '../CDNUrl';

function renderCDNUrl(url) {
  return <CDNUrl url={url} maxWidth={360} />;
}

// CDN information section for the container detail page. Reads the CDN state
// and public URLs via the backend (HEAD to the CDN Swift endpoint) and lets
// the user enable/disable CDN. Refreshes state from the authoritative HEAD
// response after each successful toggle.
function CDNSection({ container }) {
  const [store] = useState(() => new ContainerStore());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const cdn = await store.fetchCDNInfo(container);
      setData(cdn);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [container]);

  const onToggle = async () => {
    const enabled = !(data && data.cdn_enabled);
    setSubmitting(true);
    try {
      const result = await store.updateCDN(container, enabled);
      const updated = (result && result.container) || result;
      // Trust the authoritative HEAD-confirmed state returned by the backend.
      setData({
        cdn_enabled: !!updated.cdn_enabled,
        public_http_url: updated.public_http_url || null,
        public_https_url: updated.public_https_url || null,
      });
      message.success(
        enabled
          ? t('CDN enabled successfully.')
          : t('CDN disabled successfully.')
      );
    } catch (e) {
      const detail =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === 'string' ? e.response.data : null) ||
        e?.message ||
        t('Unable to update CDN.');
      message.error(detail);
      // Re-sync from the backend so the UI is never left in a stale state.
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const enabled = !!(data && data.cdn_enabled);
  const labelColProps = { xs: 24, sm: 6, md: 4 };
  const valueColProps = { xs: 24, sm: 18, md: 20 };

  return (
    <div className={styles['cdn-section']}>
      <div className={styles['cdn-header']}>
        <span className={styles['cdn-title']}>{t('CDN')}</span>
        <Button
          type="primary"
          size="small"
          loading={submitting}
          disabled={loading}
          onClick={onToggle}
        >
          {enabled ? t('Disable CDN') : t('Enable CDN')}
        </Button>
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <Row className={styles['cdn-row']}>
            <Col {...labelColProps}>{t('CDN Enabled')}</Col>
            <Col {...valueColProps}>
              {enabled ? t('Enabled') : t('Disabled')}
            </Col>
          </Row>
          <Row className={styles['cdn-row']}>
            <Col {...labelColProps}>{t('Public HTTP URL')}</Col>
            <Col {...valueColProps}>
              {renderCDNUrl(data && data.public_http_url)}
            </Col>
          </Row>
          <Row className={styles['cdn-row']}>
            <Col {...labelColProps}>{t('Public HTTPS URL')}</Col>
            <Col {...valueColProps}>
              {renderCDNUrl(data && data.public_https_url)}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

function PopUpContent({ item }) {
  const { container, name, shortName } = item;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const labelColProps = { xs: 24, sm: 8 };
  const valueColProps = { xs: 24, sm: 16 };

  useEffect(() => {
    let timeout = null;
    (async function () {
      setLoading(true);
      const cb = await new ObjectStore().fetchDetail({ container, name });
      timeout = setTimeout(() => {
        setLoading(false);
        setData(cb);
      }, 200);
    })();
    return () => {
      clearTimeout(timeout);
    };
  }, []);
  const content = loading ? (
    <Skeleton loading={loading} />
  ) : (
    <>
      <Row className={styles['popup-row']}>
        <Col {...labelColProps} className={styles['popup-label']}>
          {t('Name')}
        </Col>
        <Col {...valueColProps} className={styles['popup-value']}>
          {shortName}
        </Col>
      </Row>
      {data.etag && (
        <Row className={styles['popup-row']}>
          <Col {...labelColProps} className={styles['popup-label']}>
            {t('Hash')}
          </Col>
          <Col {...valueColProps} className={styles['popup-value']}>
            {data.etag}
          </Col>
        </Row>
      )}
      <Row className={styles['popup-row']}>
        <Col {...labelColProps} className={styles['popup-label']}>
          {t('Content Type')}
        </Col>
        <Col {...valueColProps} className={styles['popup-value']}>
          {data.contentType}
        </Col>
      </Row>
      <Row className={styles['popup-row']}>
        <Col {...labelColProps} className={styles['popup-label']}>
          {t('Created At')}
        </Col>
        <Col {...valueColProps} className={styles['popup-value']}>
          {getStrFromTimestamp(data.timestamp)}
        </Col>
      </Row>
      <Row className={styles['popup-row']}>
        <Col {...labelColProps} className={styles['popup-label']}>
          {t('Size')}
        </Col>
        <Col {...valueColProps} className={styles['popup-value']}>
          {bytesFilter(data.size || item.bytes)}
        </Col>
      </Row>
      {!isFolder(item) && (
        <Row className={styles['popup-row']}>
          <Col {...labelColProps} className={styles['popup-label']}>
            {t('Origin File Name')}
          </Col>
          <Col {...valueColProps} className={styles['popup-value']}>
            {decodeURIComponent(data.originFileName)}
          </Col>
        </Row>
      )}
    </>
  );
  return (
    <div key={`object_${name}`} className={styles['popup-content']}>
      {content}
    </div>
  );
}

export class ContainerObject extends Base {
  init() {
    this.store = globalObjectStore;
  }

  get policy() {
    return allCanReadPolicy;
  }

  get name() {
    return t('container objects');
  }

  get rowKey() {
    return 'name';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get clearListUnmount() {
    return true;
  }

  get hasTab() {
    return true;
  }

  get hideDownload() {
    return true;
  }

  get isInFolder() {
    const { folder } = this.params;
    return !!(folder && folder.trim());
  }

  get ableAutoFresh() {
    return false;
  }

  get primaryActionsExtra() {
    const { hasCopy, container } = this.store;
    return {
      hasCopy,
      container,
    };
  }

  getCheckboxProps(record) {
    if (isFolder(record)) {
      return {
        disabled: true,
        name: record.shortName,
      };
    }
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.match.params, prevProps.match.params)) {
      this.handleRefresh(true);
    }
  }

  getRequestFolder = (folder) => {
    if (!folder) {
      return '';
    }
    const str = decodeURIComponent(folder);
    if (str[str.length - 1] !== '/') {
      return `${str}/`;
    }
    return str;
  };

  updateFetchParams = (params) => {
    const { folder } = this.params;
    const folderPath = folder
      ? folder
          .split('/')
          .filter((part) => part)
          .join('/')
      : '';
    const prefix = this.getRequestFolder(folderPath);
    return {
      ...params,
      prefix,
    };
  };

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'shortName',
      render: (name, record) => {
        const { type, container } = record;
        if (type === 'folder') {
          const folderPath = record.name;
          return this.getLinkRender('folderDetail', name, {
            container,
            folder: folderPath,
          });
        }
        return name;
      },
    },
    {
      title: t('Size'),
      dataIndex: 'bytes',
      isHideable: true,
      valueRender: 'formatSize',
      render: (value, data) => {
        if (data.type === 'folder') {
          return '-';
        }
        return bytesFilter(value);
      },
    },
    {
      title: t('Last Updated'),
      dataIndex: 'last_modified',
      isHideable: true,
      valueRender: 'sinceTime',
    },
    {
      title: t('Detail'),
      dataIndex: 'detail',
      isHideable: true,
      render: (_, data) => {
        const content = <PopUpContent item={data} />;
        return (
          <Popover content={content} destroyTooltipOnHide trigger="click">
            <span className="link-class">{t('Detail')}</span>
          </Popover>
        );
      },
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'shortName',
      },
    ];
  }

  handleRefresh = (force) => {
    const { inAction, inSelect } = this;
    if (inAction || (inSelect && !force)) {
      return;
    }
    if (!force && this.autoRefreshCount >= this.autoRefreshCountMax) {
      return;
    }
    if (force) {
      this.autoRefreshCount = 0;
    }
    const { page, limit, sortKey, sortOrder, filters } = this.list;
    const params = {
      page,
      limit,
      sortKey,
      sortOrder,
      ...toJS(filters),
      silent: !force,
    };
    if (force) {
      params.page = 1;
    }
    this.handleFetch(params, true);
    if (this.inDetailPage && force && this.shouldRefreshDetail) {
      this.refreshDetailData();
    }
  };

  renderHeader() {
    const { container = '', folder = '' } = this.params || {};
    const folderPath = folder
      ? folder
          .split('/')
          .filter((part) => part)
          .join('/')
      : '';
    const folders = folderPath.split('/').filter((it) => !!it);
    const containerLink = {
      path: this.getRoutePath('containerDetail', { id: container }),
      link: this.getLinkRender('containerDetail', container, { id: container }),
    };
    const items = [containerLink];
    const folderLinks = folders.map((it, index) => {
      const path = folders.slice(0, index + 1).join('/');
      return {
        path: this.getRoutePath('folderDetail', {
          container,
          folder: path,
        }),
        link: this.getLinkRender('folderDetail', it, {
          container,
          folder: path,
        }),
      };
    });
    items.push(...folderLinks);
    const next = <span className={styles['item-next']}>&gt;</span>;
    const itemLinks = items.map((it, index) => {
      return (
        <span key={it.path}>
          {it.link} {index < items.length - 1 && next}
        </span>
      );
    });
    return (
      <>
        <div className={styles['link-header']}>
          <span className={styles['link-title']}>{t('Current Path: ')}</span>
          <span className={styles['path-items']}>{itemLinks}</span>
        </div>
        {container ? <CDNSection container={container} /> : null}
      </>
    );
  }
}

export default inject('rootStore')(observer(ContainerObject));
