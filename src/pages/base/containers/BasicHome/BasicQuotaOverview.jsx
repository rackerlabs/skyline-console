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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { Card, Col, Row, Spin } from 'antd';
import { QuotaOverview } from 'pages/base/containers/Overview/components/QuotaOverview';
import styles from 'pages/base/containers/Overview/style.less';

// Extends the shared QuotaOverview to render only the narrow set of
// quota cards passed via props — no Storage Types, no auto-appended
// Share/Zun/Magnum/Trove cards.
export class BasicQuotaOverview extends QuotaOverview {
  // Override so the auto-added optional cards (Share, Zun, Magnum,
  // Trove) don't leak in.
  get quotaCardList() {
    return this.props.quotaCardList || [];
  }

  renderQuotaCardList = () => {
    const { isLoading } = this.state;
    return (
      <Row className={styles.content}>
        {this.quotaCardList.map((item) => (
          <Col className={styles.card} span={24} key={item.type}>
            <Card
              title={item.text}
              bordered={false}
              loading={isLoading}
              size="small"
            >
              <Row gutter={24}>
                {isLoading ? (
                  <Spin />
                ) : (
                  this.renderQuotaCard(
                    this.projectStore.quota,
                    this.getFilteredValue(item.value)
                  )
                )}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };
}

export default inject('rootStore')(observer(BasicQuotaOverview));
