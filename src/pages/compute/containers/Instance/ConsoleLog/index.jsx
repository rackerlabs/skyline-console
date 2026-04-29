import React, { useCallback, useEffect, useState } from 'react';
import { Button, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import globalInstanceLogStore from 'stores/nova/instance';

export default function InstanceConsoleLog(props) {
  const {
    match: {
      params: { id },
    },
  } = props;
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFullLogs = useCallback(async () => {
    setLoading(true);
    const data = await globalInstanceLogStore.fetchLogs(id, null);
    setLogs(data?.output || '');
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchFullLogs();
  }, [fetchFullLogs]);

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingLeft: 4,
        }}
      >
        <h2 style={{ margin: 0 }}>{t('Console Log')}</h2>
        <Button
          type="primary"
          onClick={fetchFullLogs}
          icon={<ReloadOutlined />}
          loading={loading}
          style={{
            width: 110,
            display: 'inline-flex',
            justifyContent: 'center',
          }}
        >
          {t('Refresh')}
        </Button>
      </div>
      {loading ? (
        <Skeleton loading={loading} active />
      ) : logs ? (
        <div
          style={{
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'auto',
            borderRadius: 4,
            backgroundColor: '#90a4ae',
            color: '#fff',
            padding: 16,
            fontSize: 12,
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {logs}
          </pre>
        </div>
      ) : (
        <div>{t('No Logs...')}</div>
      )}
    </div>
  );
}
