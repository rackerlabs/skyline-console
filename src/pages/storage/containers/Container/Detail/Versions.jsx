import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Menu,
  Modal,
  Skeleton,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import FileSaver from 'file-saver';
import { DownOutlined, HistoryOutlined } from '@ant-design/icons';
import ObjectVersionStore from 'stores/swift/object-version';
import {
  canRestoreVersion,
  getVersionId,
  getVersionKey,
  isCurrentVersion,
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

const isNotFound = (error) =>
  !!(error && error.response && error.response.status === 404);

function VersionRowActions({ item, row, store, onVersionGone, onRestored }) {
  const [largeObject, setLargeObject] = useState(null);
  const [checkingLargeObject, setCheckingLargeObject] = useState(false);
  const versionKey = getVersionKey(row);
  const offerRestore = canRestoreVersion(row);

  useEffect(() => {
    setLargeObject(null);
    setCheckingLargeObject(false);
  }, [versionKey]);

  const handleGoneOrError = (error) => {
    if ((error && error.isVersionGone) || isNotFound(error)) {
      onVersionGone();
      return true;
    }
    message.error(getSwiftErrorBody(error));
    return false;
  };

  const runAction = async (request, successMessage) => {
    try {
      const result = await request();
      message.success(
        typeof successMessage === 'function'
          ? successMessage(result)
          : successMessage
      );
      await onRestored();
    } catch (error) {
      if (!handleGoneOrError(error)) {
        throw error;
      }
    }
  };

  const confirmAction = (title, content, onOk) => {
    Modal.confirm({
      title,
      content,
      okText: t('Confirm'),
      cancelText: t('Cancel'),
      onOk,
    });
  };

  const download = async () => {
    try {
      const response = await store.download(row);
      FileSaver.saveAs(
        response.data || response,
        item.shortName || item.name.split('/').pop()
      );
    } catch (error) {
      handleGoneOrError(error);
    }
  };

  const onMenuVisibleChange = async (visible) => {
    if (!visible || !offerRestore || largeObject !== null) {
      return;
    }
    setCheckingLargeObject(true);
    try {
      setLargeObject(await store.isLargeObject(row));
    } catch (error) {
      handleGoneOrError(error);
    } finally {
      setCheckingLargeObject(false);
    }
  };

  if (isDeleteMarker(row)) {
    return null;
  }

  // Keep Restore as new visible (disabled) while HEAD runs; hide only for SLO.
  const showRestoreAsNew = offerRestore && largeObject !== true;
  const restoreAsNewReady = largeObject === false && !checkingLargeObject;

  return (
    <Dropdown
      trigger={['click']}
      onVisibleChange={onMenuVisibleChange}
      overlay={
        <Menu>
          <Menu.Item key="download" onClick={download}>
            {t('Download')}
          </Menu.Item>
          {offerRestore && (
            <Menu.Item
              key="restore"
              onClick={() =>
                confirmAction(
                  t('Restore'),
                  t(
                    'Restore this version as the current object without creating a new version?'
                  ),
                  () =>
                    runAction(() => store.restore(row), t('Version restored.'))
                )
              }
            >
              {t('Restore')}
            </Menu.Item>
          )}
          {showRestoreAsNew && (
            <Menu.Item
              key="restore-as-new"
              disabled={!restoreAsNewReady}
              onClick={
                restoreAsNewReady
                  ? () =>
                      confirmAction(
                        t('Restore as new version'),
                        t(
                          'Copy this version to create a new current version of the object?'
                        ),
                        () =>
                          runAction(
                            () => store.restoreAsNewVersion(row),
                            (versionId) =>
                              versionId
                                ? t('Restored as new version {id}', {
                                    id: versionId,
                                  })
                                : t('Restored as new version.')
                          )
                      )
                  : undefined
              }
            >
              {t('Restore as new version')}
            </Menu.Item>
          )}
        </Menu>
      }
    >
      <Button type="link" size="small">
        {t('Actions')} <DownOutlined />
      </Button>
    </Dropdown>
  );
}

class VersionsDrawerContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { versionGone: false };
  }

  refreshDrawer = async (versionGone = false) => {
    this.setState({ versionGone });
    await this.props.store.reload();
  };

  render() {
    const { item, onClose, store } = this.props;
    const { versionGone } = this.state;
    const versionCount = store.hasMore
      ? t('{count} versions loaded so far', { count: store.rows.length })
      : t('Total versions: {count}', { count: store.rows.length });
    const versions = store.rows.slice();
    const columns = [
      {
        title: t('Status'),
        key: 'status',
        width: 170,
        render: (_, row) => (
          <div className={styles['version-status']}>
            {isCurrentVersion(row, versions) && (
              <Tag color="green">{t('Current')}</Tag>
            )}
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
        width: 120,
        render: (_, row) => (
          <VersionRowActions
            item={item}
            row={row}
            store={store}
            onVersionGone={() => this.refreshDrawer(true)}
            onRestored={() => this.refreshDrawer(false)}
          />
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
              <div>{t('Versions')}</div>
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
        {versionGone && (
          <Alert
            className={styles['versions-error']}
            type="warning"
            showIcon
            message={t('This version no longer exists')}
          />
        )}
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
            isCurrentVersion(row, versions) ? styles['version-current'] : ''
          }
          columns={columns}
          dataSource={versions}
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

const VersionsButton = observer(({ store, onClick }) => (
  <button
    type="button"
    className={`link-class ${styles['versions-link']}`}
    title={store.error ? t('Unable to load versions.') : undefined}
    onClick={onClick}
  >
    <HistoryOutlined className={styles['versions-link-icon']} />
    {t('Versions')}
  </button>
));

export default function Versions({ item }) {
  const [visible, setVisible] = useState(false);
  const store = useMemo(
    () => new ObjectVersionStore(item.container, item.name),
    [item]
  );

  useEffect(() => {
    if (visible && store.rows.length === 0 && store.hasMore && !store.loading) {
      store.loadMore();
    }
  }, [visible, store]);

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
