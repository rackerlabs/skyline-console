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

import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';
import { getInsertHeaderCard } from 'resources/octavia/lb';
import { isEmpty } from 'lodash';
import { algorithmDict } from 'resources/octavia/pool';
import client from 'client';

export class BaseDetail extends Base {
  state = {
    policies: [], // Store full policy details
    loading: false,
    error: null,
  };

  componentDidMount() {
    this.fetchPolicyDetailsAndRules();
  }

  fetchPolicyDetailsAndRules = async () => {
    const detailData = this.detailData || {};
    const l7policies = Array.isArray(detailData.l7policies)
      ? detailData.l7policies
      : [];
    if (l7policies.length === 0) return;

    this.setState({ loading: true, error: null });
    try {
      if (!client.octavia || !client.octavia.l7policies) {
        throw new Error('client.octavia.l7policies is not available');
      }
      const validPolicies = l7policies.filter((p) => p.id);
      const policies = await Promise.all(
        validPolicies.map(async (policy) => {
          const { l7policy } = await client.octavia.l7policies.show(policy.id);
          return l7policy;
        })
      );

      this.setState({ policies, loading: false });
    } catch (error) {
      console.error('Error fetching policy details:', error);
      this.setState({
        error: t('Failed to fetch policy details: ') + error.message,
        loading: false,
      });
    }
  };

  get leftCards() {
    const cards = [this.poolCard];
    const {
      insert_headers = {},
      default_pool_id,
      l7policies = [],
    } = this.detailData;
    if (default_pool_id) {
      cards.push(this.healthMonitor);
    }
    if (!isEmpty(insert_headers)) {
      cards.push(this.customHeaders);
    }
    if (l7policies.length > 0) {
      cards.push(this.l7PoliciesCard);
    }
    return cards;
  }

  get rightCards() {
    const { protocol } = this.detailData || {};
    if (protocol === 'TERMINATED_HTTPS' && !this.isAdminPage) {
      return [this.certificateInfo];
    }
    return [];
  }

  get poolCard() {
    const { default_pool = {}, default_pool_id } = this.detailData || {};
    const { name, protocol, lb_algorithm, description, admin_state_up } =
      default_pool;
    const options = !default_pool_id
      ? [
          {
            label: '',
            content: t('No default pool set'),
          },
        ]
      : [
          {
            label: t('Name'),
            content: name || '-',
          },
          {
            label: t('Protocol'),
            content: protocol || '-',
          },
          {
            label: t('LB Algorithm'),
            content: algorithmDict[lb_algorithm] || lb_algorithm || '-',
          },
          {
            label: t('Admin State Up'),
            content: admin_state_up ? t('On') : t('Off'),
          },
          {
            label: t('Description'),
            content: description || '-',
          },
        ];
    return {
      title: t('Pool Info'),
      options,
    };
  }

  get customHeaders() {
    const { insert_headers = {} } = this.detailData || {};
    return getInsertHeaderCard(insert_headers || {});
  }

  get healthMonitor() {
    const healthMonitor = this.detailData.healthMonitor || {};
    const { type, delay, timeout, max_retries, admin_state_up, url_path } =
      healthMonitor;
    const options = [
      {
        label: t('Enable Health Monitor'),
        content: !isEmpty(healthMonitor) ? t('Yes') : t('No'),
      },
    ];
    if (!isEmpty(healthMonitor)) {
      options.push(
        ...[
          {
            label: t('Health Monitor Type'),
            content: type,
          },
          {
            label: t('Delay Interval(s)'),
            content: delay,
          },
          {
            label: t('Timeout(s)'),
            content: timeout,
          },
          {
            label: t('Max Retries'),
            content: max_retries,
          },
          {
            label: t('Admin State Up'),
            content: admin_state_up ? t('On') : t('Off'),
          },
          {
            label: t('Monitoiring URL'),
            content: url_path || '/',
          },
        ]
      );
    }
    return {
      title: t('Health Monitor'),
      options,
    };
  }

  get certificateInfo() {
    const options = [
      {
        label: t('Server Certificate'),
        dataIndex: 'serverCertificateId',
        render: (value) => {
          return value
            ? this.getLinkRender(
                'certificateContainerDetail',
                value,
                {
                  id: value,
                },
                null
              )
            : '-';
        },
      },
      {
        label: t('CA Certificate'),
        dataIndex: 'caCertificateId',
        render: (value) => {
          return value
            ? this.getLinkRender(
                'certificateSecretDetail',
                value,
                {
                  id: value,
                },
                null
              )
            : '-';
        },
      },
      {
        label: t('SNI Certificate'),
        dataIndex: 'sniCertificateId',
        render: (value) => {
          return value.length
            ? value.map(
                (it, index) =>
                  this.getLinkRender(
                    'certificateContainerDetail',
                    `${it}${index === value.length - 1 ? '' : ' , '}`,
                    {
                      id: it,
                    }
                  ),
                null
              )
            : '-';
        },
      },
    ];
    return {
      title: t('certificate'),
      options,
      labelCol: 4,
    };
  }

  get l7PoliciesCard() {
    const state = this.state || { policies: [], loading: false, error: null };
    const { policies = [], loading, error } = state;
    const options = [
      {
        label: t('Number of L7 Policies'),
        content: Array.isArray(policies) ? policies.length : 0,
      },
    ];

    if (loading) {
      options.push({
        label: t('Loading'),
        content: t('Fetching policy details...'),
      });
    } else if (error) {
      options.push({
        label: t('Error'),
        content: error,
      });
    } else if (Array.isArray(policies) && policies.length > 0) {
      policies.forEach((policy, index) => {
        options.push({
          label: t(`Policy ${index + 1} - ID`),
          content: policy.id || '-',
        });
        options.push({
          label: t(`Policy ${index + 1} - Action`),
          content: policy.action || '-',
        });
        options.push({
          label: t(`Policy ${index + 1} - Redirect URL`),
          content: policy.redirect_url || '-',
        });
        options.push({
          label: t(`Policy ${index + 1} - Position`),
          content: policy.position || '-',
        });
        options.push({
          label: t(`Policy ${index + 1} - Operating Status`),
          content: policy.operating_status || '-',
        });
        if (Array.isArray(policy.rules) && policy.rules.length > 0) {
          policy.rules.forEach((rule, ruleIndex) => {
            options.push({
              label: t(`Policy ${index + 1} - Rule ${ruleIndex + 1} - ID`),
              content: rule.id || '-',
            });
          });
        } else {
          options.push({
            label: t(`Policy ${index + 1} - Rules`),
            content: t('No rules configured'),
          });
        }
      });
    }

    return {
      title: t('L7 Policies'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
