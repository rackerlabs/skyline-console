import React, { useCallback, useEffect, useState } from 'react';
import globalInstanceLogStore from 'src/stores/nova/instance';
import { Button, Col, Form, InputNumber, Row, Skeleton } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import tableStyles from 'src/components/Tables/Base/index.less';
import styles from './index.less';

export default function Log({ detail }) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);

  const getLogs = useCallback(
    async (tailSize) => {
      setLoading(true);
      const data = await globalInstanceLogStore.fetchLogs(detail.id, tailSize);
      setLogs(data.output);
      setLoading(false);
    },
    [detail.id]
  );

  useEffect(() => {
    getLogs(35);
  }, [getLogs]);

  const onFinish = useCallback(
    (value) => {
      getLogs(value.number);
    },
    [getLogs]
  );

  const viewFullLog = useCallback(async () => {
    setLoading(true);
    const data = await globalInstanceLogStore.fetchLogs(detail.id, null);
    const newWindow = window.open('console', '_blank');
    const title = t('Console Log');
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
        </head>
        <body>
          <pre>${data.output}</pre>
        </body>
      </html>`;
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    setLoading(false);
  }, [detail.id]);

  return (
    <div className={styles.wrapper}>
      <Form initialValues={{ number: 35 }} onFinish={onFinish}>
        <Row gutter={[16, 8]} className={styles['toolbar-row']}>
          <Col className="gutter-row" xs={24} md={12} xl={16}>
            <h2 className={styles.title}>{t('Instance Console Log')}</h2>
          </Col>
          <Col className="gutter-row" xs={24} sm={12} md={6} xl={4}>
            <Form.Item
              name="number"
              label={t('Log Length')}
              className={styles['log-length']}
            >
              <InputNumber
                min={1}
                max={100000}
                placeholder={t('Log Length')}
                className={styles['log-length-input']}
                addonAfter={<SettingOutlined />}
              />
            </Form.Item>
          </Col>
          <Col className="gutter-row" xs={24} sm={12} md={6} xl={4}>
            <div
              className={classnames(
                tableStyles['table-header-btns'],
                styles['log-actions']
              )}
            >
              <Button type="primary" htmlType="submit">
                <SearchOutlined />
              </Button>

              <Button type="primary" onClick={viewFullLog}>
                {t('View Full Log')}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>

      <div className={styles['log-output']}>
        {loading ? (
          <Skeleton loading={loading} active />
        ) : logs ? (
          <pre className={styles['log-text']}>{logs}</pre>
        ) : (
          t('No Logs...')
        )}
      </div>
    </div>
  );
}
