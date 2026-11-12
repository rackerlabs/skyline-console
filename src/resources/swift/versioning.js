export const VERSIONING_ENABLED = 'enabled';
export const VERSIONING_SUSPENDED = 'suspended';
export const VERSIONING_LEGACY = 'legacy';
export const VERSIONING_NONE = 'none';
export const VERSIONING_UNKNOWN = 'unknown';

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
};

// Build the versioning view of a container from its HEAD response headers.
// Axios lower-cases header names; values are compared case-insensitively.
export const parseVersioningHeaders = (headers = {}) => {
  const enabledRaw = headers['x-versions-enabled'];
  const legacyLocation =
    headers['x-versions-location'] || headers['x-history-location'] || '';
  const syncTo = headers['x-container-sync-to'] || '';
  let state = VERSIONING_NONE;
  if (enabledRaw !== undefined && enabledRaw !== null && enabledRaw !== '') {
    state =
      String(enabledRaw).trim().toLowerCase() === 'true'
        ? VERSIONING_ENABLED
        : VERSIONING_SUSPENDED;
  } else if (legacyLocation) {
    state = VERSIONING_LEGACY;
  }
  return {
    state,
    legacyLocation: legacyLocation ? safeDecode(legacyLocation) : '',
    syncTo,
  };
};

export const isVersionedState = (state) =>
  state === VERSIONING_ENABLED || state === VERSIONING_SUSPENDED;

export const getVersioningLabel = (state) => {
  switch (state) {
    case VERSIONING_ENABLED:
      return t('Enabled');
    case VERSIONING_SUSPENDED:
      return t('Suspended');
    case VERSIONING_LEGACY:
      return t('Legacy');
    case VERSIONING_NONE:
      return t('Disabled');
    default:
      return '-';
  }
};

export const getVersioningTagColor = (state) => {
  switch (state) {
    case VERSIONING_ENABLED:
      return 'green';
    case VERSIONING_SUSPENDED:
      return 'orange';
    default:
      return 'default';
  }
};

// Reason why "Manage Versioning" must be disabled for a container, or null.
export const getManageVersioningDisabledReason = (info) => {
  if (!info) {
    return null;
  }
  if (info.legacyLocation) {
    return t('Uses legacy versioning (archive: {container})', {
      container: info.legacyLocation,
    });
  }
  if (info.syncTo) {
    return t("Container sync sources can't be versioned");
  }
  return null;
};

// Swift error bodies are shown verbatim, so return the raw response body.
export const getSwiftErrorBody = (error) => {
  const { response } = error || {};
  const data = response ? response.data : undefined;
  if (typeof data === 'string' && data) {
    return data;
  }
  if (data && typeof data === 'object') {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      // fall through
    }
  }
  if (response && (response.status || response.statusText)) {
    return [response.status, response.statusText].filter(Boolean).join(' ');
  }
  if (error && typeof error.message === 'string' && error.message) {
    return error.message;
  }
  return String(error || '');
};
