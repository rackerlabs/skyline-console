import React, { useState } from 'react';
import { Tooltip, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

export default function CDNUrl({ url, maxWidth = 220 }) {
  const [copied, setCopied] = useState(false);

  if (!url) {
    return '-';
  }

  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      message.success(t('Copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error(t('Copy failed'));
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        maxWidth,
        gap: 6,
      }}
    >
      <Tooltip title={url}>
        <span
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-all',
            minWidth: 0,
          }}
        >
          {url}
        </span>
      </Tooltip>
      <Tooltip title={copied ? t('Copied') : t('Copy')}>
        {copied ? (
          <CheckOutlined style={{ color: '#52c41a', flex: 'none' }} />
        ) : (
          <CopyOutlined
            onClick={onCopy}
            style={{ color: '#1890ff', cursor: 'pointer', flex: 'none' }}
          />
        )}
      </Tooltip>
    </span>
  );
}
