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

const { Option } = Select;

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
            label="Action"
            name={[field.name, 'action']}
            rules={[{ required: true, message: 'Action is required' }]}
          >
            <Select
              placeholder="Select Action"
              onChange={(val) => setAction(val)}
            >
              <Option value="REDIRECT_TO_URL">REDIRECT_TO_URL</Option>
              <Option value="REJECT">REJECT</Option>
              <Option value="REDIRECT_TO_POOL">REDIRECT_TO_POOL</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {action === 'REDIRECT_TO_URL' && (
        <Row>
          <Col span={24}>
            <Form.Item
              label="Redirect URL"
              name={[field.name, 'redirect_url']}
              rules={[
                { required: true, message: 'Redirect URL is required' },
                { type: 'url', message: 'Enter a valid URL' },
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
              label="Redirect Pool ID"
              name={[field.name, 'redirect_pool_id']}
              rules={[{ required: true, message: 'Pool ID is required' }]}
            >
              <Select placeholder="Select Pool">
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
              <div
                key={ruleField.key}
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
                      label="Type"
                      name={[ruleField.name, 'type']}
                      rules={[{ required: true, message: 'Type is required' }]}
                    >
                      <Select>
                        <Option value="HOST_NAME">HOST_NAME</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={20}>
                    <Form.Item
                      label="Compare Type"
                      name={[ruleField.name, 'compareType']}
                      rules={[
                        { required: true, message: 'Compare type is required' },
                      ]}
                    >
                      <Select>
                        <Option value="EQUAL_TO">EQUAL_TO</Option>
                        <Option value="CONTAINS">CONTAINS</Option>
                        <Option value="STARTS_WITH">STARTS_WITH</Option>
                        <Option value="ENDS_WITH">ENDS_WITH</Option>
                        <Option value="REGEX">REGEX</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={16}>
                    <Form.Item
                      label="Value"
                      name={[ruleField.name, 'value']}
                      rules={[{ required: true, message: 'Value is required' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col span={16}>
                    <Form.Item
                      label="Key (Optional)"
                      name={[ruleField.name, 'key']}
                    >
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col span={2}>
                    <Form.Item
                      label="Invert"
                      name={[ruleField.name, 'invert']}
                      valuePropName="checked"
                    >
                      <Checkbox />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <MinusCircleOutlined
                      onClick={() => remove(ruleField.name)}
                      style={{ color: '#ff4d4f', fontSize: 18 }}
                    />
                  </Col>
                </Row>
              </div>
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
              >
                Add Rule
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default L7PolicyItem;
