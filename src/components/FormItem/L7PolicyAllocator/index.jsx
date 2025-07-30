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
import { Form, Button, Row, Col } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import L7PolicyItem from './L7PolicyItem';

const L7PolicyAllocator = ({ formItemProps }) => {
  const { name } = formItemProps;

  return (
    <div style={{ padding: 20 }}>
      <Form.Item label="Layer 7 Policies">
        <Form.List name={name}>
          {(fields, { add, remove }) => (
            <>
              {fields.length === 0 && (
                <div style={{ marginBottom: 12, color: '#888' }}>
                  No policies configured.
                </div>
              )}

              {fields.map((field) => (
                <Row key={field.key} gutter={[16, 16]}>
                  <Col span={22}>
                    <Form.Item
                      name={field.name}
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (!value?.action) {
                              return Promise.reject(
                                new Error('Action is required')
                              );
                            }

                            if (
                              (value.action === 'REDIRECT_TO_URL' &&
                                !value.redirect_url) ||
                              (value.action === 'REDIRECT_TO_POOL' &&
                                !value.redirect_pool_id)
                            ) {
                              return Promise.reject(
                                new Error(
                                  value.action === 'REDIRECT_TO_URL'
                                    ? 'Redirect URL is required'
                                    : 'Redirect Pool ID is required'
                                )
                              );
                            }

                            if (
                              ['REDIRECT_TO_POOL', 'REDIRECT_TO_URL'].includes(
                                value.action
                              ) &&
                              (!value.rules || value.rules.length === 0)
                            ) {
                              return Promise.reject(
                                new Error('At least one rule is required')
                              );
                            }

                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <L7PolicyItem field={field} />
                    </Form.Item>
                  </Col>

                  <Col
                    span={2}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <MinusCircleOutlined
                      onClick={() => remove(field.name)}
                      style={{ fontSize: 20, color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                onClick={() => add({ action: '', rules: [] })}
                icon={<PlusOutlined />}
                block
                style={{ marginTop: 16 }}
              >
                Add Policy
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </div>
  );
};

L7PolicyAllocator.isFormItem = true;

export default L7PolicyAllocator;
