import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Skeleton,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import FileSaver from 'file-saver';
import {
  DownloadOutlined,
  ExportOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import ObjectVersionStore from 'stores/swift/object-version';
import {
  getVersionId,
  getVersionKey,
  isDeleteMarker,
} from 'resources/swift/object-version';
import { getSwiftErrorBody } from 'resources/swift/versioning';
import { bytesFilter } from 'utils';
import { getLocalTimeStr } from 'utils/time';
import styles from './Versions.less';

export function VersionDetails({ store, row }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    store.fetchMetadata(row).then(
      (result) => active && setData(result),
      (reason) => active && setError(getSwiftErrorBody(reason))
    );
    return () => {
      active = false;
    };
  }, [store, getVersionKey(row), attempt]);

  if (error) {
    return (
      <>
        <Alert
          type="error"
          showIcon
          message={t('Unable to load version details.')}
          description={error}
        />
        <Button onClick={() => setAttempt(attempt + 1)}>{t('Retry')}</Button>
      </>
    );
  }
  if (!data) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }
  return (
    <Descriptions
      className={styles['version-details']}
      size="small"
      column={1}
      bordered
    >
      <Descriptions.Item label={t('Content Type')}>
        {data.contentType || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="ETag">{data.etag || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Size')}>
        {data.size === undefined || data.size === null || data.size === ''
          ? '-'
          : `${data.size} ${t('bytes')}`}
      </Descriptions.Item>
      {data.metadata.map(([key, value]) => (
        <Descriptions.Item key={key} label={key}>
          {value}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}

class VersionsDrawerContent extends React.Component {
  download = async (row) => {
    try {
      const { item, store } = this.props;
      const response = await store.download(row);
      FileSaver.saveAs(
        response.data || response,
        item.shortName || item.name.split('/').pop()
      );
    } catch (error) {
      message.error(getSwiftErrorBody(error));
    }
  };

  render() {
    const { item, onClose, store } = this.props;
    const versionCount = store.hasMore
      ? t('{count} versions loaded so far', { count: store.rows.length })
      : t('Total versions: {count}', { count: store.rows.length });
    const columns = [
      {
        title: t('Status'),
        key: 'status',
        width: 170,
        render: (_, row) => (
          <div className={styles['version-status']}>
            {row.is_latest && <Tag color="green">{t('Current')}</Tag>}
            {isDeleteMarker(row) && <Tag color="red">{t('Deleted')}</Tag>}
            {getVersionId(row) === 'null' && <Tag>{t('Pre-versioning')}</Tag>}
          </div>
        ),
      },
      {
        title: t('Last Updated'),
        dataIndex: 'last_modified',
        width: 180,
        className: styles['version-date'],
        render: (value) => (value ? getLocalTimeStr(value) : '-'),
      },
      {
        title: t('Size'),
        dataIndex: 'bytes',
        width: 90,
        render: (value, row) =>
          isDeleteMarker(row) ? '-' : bytesFilter(value),
      },
      {
        title: t('Version ID'),
        key: 'version_id',
        width: 230,
        render: (_, row) => (
          <Typography.Text
            copyable={{ text: getVersionId(row) }}
            className={styles['version-id']}
          >
            {getVersionId(row)}
          </Typography.Text>
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 110,
        render: (_, row) =>
          !isDeleteMarker(row) && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => this.download(row)}
            >
              {t('Download')}
            </Button>
          ),
      },
    ];

    return (
      <Drawer
        visible
        className={styles['versions-drawer']}
        style={{
          top: globalCSS.headerHeight,
          height: `calc(100% - ${globalCSS.headerHeight})`,
        }}
        title={
          <div className={styles['drawer-title']}>
            <HistoryOutlined className={styles['drawer-icon']} />
            <div className={styles['drawer-title-text']}>
              <div>{t('Versions Drawer')}</div>
              <div className={styles['drawer-file-name']}>
                {item.shortName || item.name}
              </div>
            </div>
          </div>
        }
        width="min(960px, 100%)"
        onClose={onClose}
        footer={
          store.hasMore && (
            <div className={styles['drawer-footer']}>
              <Button loading={store.loading} onClick={store.loadMore}>
                {store.error ? t('Retry') : t('Load More')}
              </Button>
            </div>
          )
        }
      >
        <div className={styles['versions-summary']}>
          <div className={styles['object-path']}>
            {item.container}/{item.name}
          </div>
          <Typography.Text type="secondary">{versionCount}</Typography.Text>
        </div>
        {store.error && (
          <Alert
            className={styles['versions-error']}
            type="error"
            showIcon
            message={t('Unable to load versions.')}
            description={store.error}
          />
        )}
        <Table
          className={styles['versions-table']}
          size="small"
          rowKey={getVersionKey}
          rowClassName={(row) =>
            row.is_latest ? styles['version-current'] : ''
          }
          columns={columns}
          dataSource={store.rows.slice()}
          loading={store.loading}
          pagination={false}
          scroll={{ x: 820 }}
          expandable={{
            rowExpandable: (row) => !isDeleteMarker(row),
            expandedRowRender: (row) => (
              <VersionDetails store={store} row={row} />
            ),
          }}
        />
      </Drawer>
    );
  }
}

export const VersionsDrawer = observer(VersionsDrawerContent);

const VersionsButton = observer(({ store, onClick }) => {
  const hasCount = store.rows.length > 0 || !store.hasMore;
  let count = '-';
  if (hasCount) {
    count = `${store.rows.length}${store.hasMore ? '+' : ''}`;
  } else if (store.loading) {
    count = <Spin size="small" />;
  }
  return (
    <Button
      type="primary"
      ghost
      size="small"
      icon={<ExportOutlined />}
      title={store.error ? t('Unable to load versions.') : t('Versions Drawer')}
      onClick={onClick}
    >
      {t('Versions Drawer')}
      <span className={styles['version-count']}>({count})</span>
    </Button>
  );
});

export default function Versions({ item }) {
  const [visible, setVisible] = useState(false);
  const store = useMemo(
    () => new ObjectVersionStore(item.container, item.name),
    [item]
  );

  useEffect(() => {
    store.loadMore();
  }, [store]);

  return (
    <>
      <VersionsButton store={store} onClick={() => setVisible(true)} />
      {visible && (
        <VersionsDrawer
          key={`${item.container}/${item.name}`}
          item={item}
          store={store}
          onClose={() => setVisible(false)}
        />
      )}
    </>
  );
}
