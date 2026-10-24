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
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Select, Input, Checkbox, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import client from 'client';
import {
  actionLabels,
  getL7RuleCompareTypes,
  isL7RuleKeyRequired,
  l7PolicyActions,
  l7RuleTypes,
  validateL7Policy,
  validateL7Rule,
} from 'resources/octavia/l7policy';

const { Option } = Select;

const L7RuleItem = ({ field, policyIndex, remove }) => {
  const form = Form.useFormInstance();
  const [ruleType, setRuleType] = useState(
    () =>
      form.getFieldValue([
        'l7policies',
        policyIndex,
        'rules',
        field.name,
        'type',
      ]) || 'HOST_NAME'
  );
  const compareTypes = getL7RuleCompareTypes(ruleType);

  // Build the current rule (with API field names) so the shared validator can
  // be applied to a single field, keeping the wizard in sync with Octavia.
  const rulePath = (sub) => [
    'l7policies',
    policyIndex,
    'rules',
    field.name,
    sub,
  ];
  const currentRule = (overrides) => ({
    type: ruleType,
    compare_type: form.getFieldValue(rulePath('compareType')),
    value: form.getFieldValue(rulePath('value')),
    key: form.getFieldValue(rulePath('key')),
    ...overrides,
  });

  const handleTypeChange = (type) => {
    const nextCompareTypes = getL7RuleCompareTypes(type);
    setRuleType(type);
    form.setFields([
      {
        name: ['l7policies', policyIndex, 'rules', field.name, 'compareType'],
        value: nextCompareTypes.includes('EQUAL_TO')
          ? 'EQUAL_TO'
          : nextCompareTypes[0],
      },
      {
        name: ['l7policies', policyIndex, 'rules', field.name, 'key'],
        value: undefined,
      },
      // Clear the stale value so a HOST_NAME value is not submitted as, e.g.,
      // a FILE_TYPE (matches the post-creation form's reset behavior).
      {
        name: ['l7policies', policyIndex, 'rules', field.name, 'value'],
        value: undefined,
      },
    ]);
  };

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        border: '1px dashed #ccc',
        background: '#fafafa',
      }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Form.Item
            label={t('Type')}
            name={[field.name, 'type']}
            rules={[{ required: true, message: t('Type is required') }]}
          >
            <Select onChange={handleTypeChange}>
              {l7RuleTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={20}>
          <Form.Item
            label={t('Compare Type')}
            name={[field.name, 'compareType']}
            rules={[{ required: true, message: t('Compare type is required') }]}
          >
            <Select>
              {compareTypes.map((compareType) => (
                <Option key={compareType} value={compareType}>
                  {compareType}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={16}>
          <Form.Item
            label={t('Value')}
            name={[field.name, 'value']}
            rules={[
              { required: true, message: t('Value is required') },
              {
                validator: (_, value) => {
                  const error = validateL7Rule(currentRule({ value })).value;
                  return error
                    ? Promise.reject(new Error(error))
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={16}>
          <Form.Item
            label={t('Key')}
            name={[field.name, 'key']}
            hidden={!isL7RuleKeyRequired(ruleType)}
            rules={
              isL7RuleKeyRequired(ruleType)
                ? [
                    { required: true, message: t('Key is required') },
                    {
                      validator: (_, value) => {
                        const error = validateL7Rule(
                          currentRule({ key: value })
                        ).key;
                        return error
                          ? Promise.reject(new Error(error))
                          : Promise.resolve();
                      },
                    },
                  ]
                : []
            }
          >
            <Input />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name={[field.name, 'invert']} valuePropName="checked">
            <Checkbox>{t('Invert')}</Checkbox>
          </Form.Item>
        </Col>

        <Col span={24}>
          <MinusCircleOutlined
            onClick={() => remove(field.name)}
            style={{ color: '#ff4d4f', fontSize: 18 }}
          />
        </Col>
      </Row>
    </div>
  );
};

const L7PolicyItem = ({ field }) => {
  const [action, setAction] = useState(null);
  const [pools, setPools] = useState([]);
  const form = Form.useFormInstance();

  useEffect(() => {
    const currentAction = form.getFieldValue([
      'l7policies',
      field.name,
      'action',
    ]);
    if (currentAction) setAction(currentAction);

    const fetchPools = async () => {
      try {
        const octaviaClient = client?.octavia;
        if (!octaviaClient?.pools)
          throw new Error('Octavia client not available');

        const response = await octaviaClient.pools.list();
        const poolList = Array.isArray(
          response?.pools || response?.pool || response
        )
          ? (response.pools || response.pool || response).map((pool) => ({
              id: pool.id,
            }))
          : [];

        setPools(poolList);
      } catch (error) {
        console.error('Error fetching pools:', error);
      }
    };

    fetchPools();
  }, [field.name, form]);

  return (
    <div
      style={{ border: '1px solid #f0f0f0', padding: 16, background: '#fff' }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label={t('Action')}
            name={[field.name, 'action']}
            rules={[{ required: true, message: t('Action is required') }]}
          >
            <Select
              placeholder={t('Select Action')}
              onChange={(val) => setAction(val)}
            >
              {l7PolicyActions.map((policyAction) => (
                <Option key={policyAction} value={policyAction}>
                  {actionLabels[policyAction] || policyAction}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {action === 'REDIRECT_TO_URL' && (
        <Row>
          <Col span={24}>
            <Form.Item
              label={t('Redirect URL')}
              name={[field.name, 'redirect_url']}
              rules={[
                { required: true, message: t('Redirect URL is required') },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const error = validateL7Policy({
                      action: 'REDIRECT_TO_URL',
                      redirect_url: value,
                    }).redirect_url;
                    return error
                      ? Promise.reject(new Error(error))
                      : Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
          </Col>
        </Row>
      )}

      {action === 'REDIRECT_TO_POOL' && (
        <Row>
          <Col span={24}>
            <Form.Item
              label={t('Redirect Pool ID')}
              name={[field.name, 'redirect_pool_id']}
              rules={[{ required: true, message: t('Pool ID is required') }]}
            >
              <Select placeholder={t('Select Pool')}>
                {pools.map((pool) => (
                  <Option key={pool.id} value={pool.id}>
                    {pool.id}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Form.List name={[field.name, 'rules']}>
        {(ruleFields, { add, remove }) => (
          <>
            {ruleFields.map((ruleField) => (
              <L7RuleItem
                key={ruleField.key}
                field={ruleField}
                policyIndex={field.name}
                remove={remove}
              />
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
              >
                {t('Add Rule')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default L7PolicyItem;
