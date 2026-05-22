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

import moment from 'moment';

export const MESSAGE_BANNER_TYPE = {
  maintenance: t('Maintenance'),
  notification: t('Notification'),
};

export const MESSAGE_BANNER_SOURCE = {
  manual: t('Manual'),
  rss_feed: t('RSS Feed'),
};

export const messageTypeOptions = Object.keys(MESSAGE_BANNER_TYPE).map(
  (key) => ({
    label: MESSAGE_BANNER_TYPE[key],
    value: key,
  })
);

export const sourceOptions = Object.keys(MESSAGE_BANNER_SOURCE).map((key) => ({
  label: MESSAGE_BANNER_SOURCE[key],
  value: key,
}));

export const enabledOptions = [
  {
    label: t('Enabled'),
    value: true,
  },
  {
    label: t('Disabled'),
    value: false,
  },
];

export const utcInputPlaceholder = '2026-05-07T13:00:00Z';

export const getMessageTypeLabel = (type) =>
  MESSAGE_BANNER_TYPE[type] || type || '-';

export const getMessageSourceLabel = (source) =>
  MESSAGE_BANNER_SOURCE[source] || source || '-';

export const getEnabledLabel = (enabled) =>
  enabled ? t('Enabled') : t('Disabled');

export const parseUtcTime = (value) => {
  if (!value) {
    return null;
  }
  const parsed = moment.utc(
    value,
    [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss'],
    true
  );
  return parsed.isValid() ? parsed : null;
};

export const normalizeUtcTime = (value) => {
  const parsed = parseUtcTime(value);
  return parsed ? parsed.format('YYYY-MM-DDTHH:mm:ss[Z]') : null;
};

export const formatUtcInput = (value) => normalizeUtcTime(value) || undefined;

export const formatUtcTime = (value) => {
  const parsed = parseUtcTime(value);
  return parsed ? parsed.format('YYYY-MM-DD HH:mm:ss [UTC]') : '-';
};

export const utcTimeValidator = (_rule, value) => {
  if (!value || parseUtcTime(value)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(t('Please enter a valid UTC date/time.')));
};

export const getMessageBannerPayload = (values, type) => {
  const payload = {
    type,
    title: values.title || null,
    message: values.message,
    impacted_service: values.impacted_service || null,
    start_at: normalizeUtcTime(values.start_at),
    expires_at: normalizeUtcTime(values.expires_at),
    region: values.region || null,
    enabled: values.enabled !== false,
  };

  if (type !== 'maintenance') {
    payload.impacted_service = null;
    payload.start_at = null;
  }

  return payload;
};
