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
import { Card, Spin, Tag } from 'antd';
import {
  ToolOutlined,
  BellOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import globalMessageBannerStore from 'stores/skyline/message-banner';
import {
  formatUtcTime,
  getMessageTypeLabel,
  parseUtcTime,
} from 'resources/skyline/message-banner';
import styles from '../style.less';

export class MessageBannerPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      now: Date.now(),
      currentSlide: 0,
    };
  }

  componentDidMount() {
    this.fetchActive();
    this.expireTimer = setInterval(this.updateNow, 60000);
    this.refreshTimer = setInterval(this.fetchActive, 300000);
    this.autoSlideTimer = setInterval(this.autoSlide, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.expireTimer);
    clearInterval(this.refreshTimer);
    clearInterval(this.autoSlideTimer);
  }

  get store() {
    return globalMessageBannerStore;
  }

  get activeBanners() {
    const { now } = this.state;
    return this.store.activeBanners.filter((banner) => {
      const expiresAt = parseUtcTime(banner.expires_at);
      return expiresAt && expiresAt.valueOf() > now;
    });
  }

  fetchActive = () => {
    globalMessageBannerStore.fetchActive().catch(() => {});
  };

  updateNow = () => {
    this.setState({
      now: Date.now(),
    });
  };

  autoSlide = () => {
    if (this.paused) {
      return;
    }
    this.advanceSlide(1);
  };

  advanceSlide = (step) => {
    const total = this.activeBanners.length;
    if (total <= 1) {
      return;
    }
    this.setState((prevState) => ({
      currentSlide: ((prevState.currentSlide || 0) + step + total) % total,
    }));
  };

  renderMeta(label, value) {
    if (!value) {
      return null;
    }
    return (
      <div className={styles['banner-meta-item']}>
        <span className={styles['banner-meta-label']}>{label}</span>
        <span>{value}</span>
      </div>
    );
  }

  renderIcon(type) {
    return type === 'maintenance' ? <ToolOutlined /> : <BellOutlined />;
  }

  renderBanner = (banner) => {
    const {
      id,
      type,
      title,
      message,
      impacted_service,
      start_at,
      expires_at,
      region,
    } = banner;
    const isMaintenance = type === 'maintenance';
    const color = isMaintenance ? 'blue' : 'orange';
    const slideClass = isMaintenance
      ? `${styles['banner-slide']} ${styles['banner-slide-maintenance']}`
      : `${styles['banner-slide']} ${styles['banner-slide-notification']}`;
    return (
      <div className={slideClass} key={id}>
        <div className={styles['banner-header']}>
          <Tag color={color} className={styles['banner-type']}>
            {this.renderIcon(type)}
            <span>{getMessageTypeLabel(type)}</span>
          </Tag>
          <div className={styles['banner-title']}>{title || '-'}</div>
        </div>
        <div className={styles['banner-message']}>{message}</div>
        <div className={styles['banner-meta']}>
          {this.renderMeta(t('Impacted Service'), impacted_service)}
          {this.renderMeta(t('Region'), region || t('All Regions'))}
          {this.renderMeta(
            t('Start Time (UTC)'),
            start_at ? formatUtcTime(start_at) : null
          )}
          {this.renderMeta(t('End Time (UTC)'), formatUtcTime(expires_at))}
        </div>
      </div>
    );
  };

  renderContent() {
    const { activeBanners } = this;
    if (!activeBanners.length) {
      return null;
    }
    if (activeBanners.length === 1) {
      return this.renderBanner(activeBanners[0]);
    }
    const total = activeBanners.length;
    const currentSlide = (this.state.currentSlide || 0) % total;
    return (
      <div
        className={styles['banner-carousel']}
        onMouseEnter={() => {
          this.paused = true;
        }}
        onMouseLeave={() => {
          this.paused = false;
        }}
      >
        {this.renderBanner(activeBanners[currentSlide])}
        <button
          aria-label={t('Previous message banner')}
          className={`${styles['banner-nav-btn']} ${styles['banner-nav-left']}`}
          onClick={() => this.advanceSlide(-1)}
          type="button"
        >
          <LeftOutlined />
        </button>
        <button
          aria-label={t('Next message banner')}
          className={`${styles['banner-nav-btn']} ${styles['banner-nav-right']}`}
          onClick={() => this.advanceSlide(1)}
          type="button"
        >
          <RightOutlined />
        </button>
      </div>
    );
  }

  render() {
    const { activeBanners } = this;
    const { isActiveLoading } = this.store;
    if (!activeBanners.length && !isActiveLoading) {
      return null;
    }
    return (
      <Card className={styles['message-banner']} bordered={false}>
        <Spin spinning={isActiveLoading}>{this.renderContent()}</Spin>
      </Card>
    );
  }
}

export default observer(MessageBannerPanel);
