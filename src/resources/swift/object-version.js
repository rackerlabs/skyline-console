export const getVersionId = (row) => String(row.version_id);

export const isDeleteMarker = (row) =>
  (row.content_type || '').toLowerCase().replace(/\s/g, '') ===
  'application/x-deleted;swift_versions_deleted=1';

// Swift may flag both a restored data version and a newer delete marker as
// is_latest. Treat a live (non-marker) is_latest as the real current object.
export const hasLiveCurrentVersion = (versions = []) =>
  versions.some((row) => row.is_latest && !isDeleteMarker(row));

export const isCurrentVersion = (row, versions = []) => {
  if (!row || !row.is_latest) {
    return false;
  }
  if (!isDeleteMarker(row)) {
    return true;
  }
  return !hasLiveCurrentVersion(versions);
};

export const canRestoreVersion = (row) =>
  !!row && !row.is_latest && !isDeleteMarker(row);

export const createVersionGoneError = (
  message = t('This version no longer exists')
) => {
  const error = new Error(message);
  error.isVersionGone = true;
  return error;
};

export const normalizeHeaders = (headers = {}) =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

export const isLargeObjectHeaders = (headers = {}) => {
  const normalized = normalizeHeaders(headers);
  return (
    String(normalized['x-static-large-object'] || '').toLowerCase() ===
      'true' || !!normalized['x-object-manifest']
  );
};

export const getObjectVersionIdHeader = (headers = {}) => {
  const value = normalizeHeaders(headers)['x-object-version-id'];
  return !value || value === 'null' ? '' : String(value);
};

export const getVersionKey = (row) =>
  JSON.stringify([row.name, getVersionId(row)]);

const byLastModifiedDesc = (a, b) =>
  String(b.last_modified || '').localeCompare(String(a.last_modified || ''));

export const mergeObjectVersions = (previous, page, name) => {
  const versions = new Map();
  [...previous, ...page].forEach((row) => {
    if (row.name === name) {
      versions.set(getVersionKey(row), row);
    }
  });
  return [...versions.values()].sort(byLastModifiedDesc);
};

export const getObjectVersionMetadata = (headers = {}, fallbackSize) => {
  const normalized = normalizeHeaders(headers);
  const contentLength = normalized['content-length'];
  const hasContentLength =
    contentLength !== undefined &&
    contentLength !== null &&
    String(contentLength).trim() !== '';
  return {
    contentType: normalized['content-type'],
    etag: normalized.etag,
    size: hasContentLength ? contentLength : fallbackSize,
    metadata: Object.entries(headers).filter(([key]) =>
      key.toLowerCase().startsWith('x-object-meta-')
    ),
  };
};

export const isDeletedObjectName = (versions = []) => {
  if (!versions.length) {
    return false;
  }
  if (hasLiveCurrentVersion(versions)) {
    return false;
  }
  const latest = versions.find((row) => row.is_latest);
  return latest ? isDeleteMarker(latest) : true;
};

export const getNewestRecoverableVersion = (versions = []) =>
  versions.filter((row) => !isDeleteMarker(row)).sort(byLastModifiedDesc)[0] ||
  null;

const isDirectChildName = (name, prefix = '') => {
  if (!name || name.endsWith('/')) {
    return false;
  }
  if (!prefix) {
    return !name.includes('/');
  }
  if (!name.startsWith(prefix)) {
    return false;
  }
  const rest = name.slice(prefix.length);
  return !!rest && !rest.includes('/');
};

export const collateDeletedObjects = (rows = [], prefix = '') => {
  const byName = new Map();
  rows.forEach((row) => {
    if (row.subdir || !isDirectChildName(row.name, prefix)) {
      return;
    }
    const list = byName.get(row.name) || [];
    list.push(row);
    byName.set(row.name, list);
  });

  return [...byName.entries()]
    .filter(([, versions]) => isDeletedObjectName(versions))
    .map(([name, versions]) => {
      const recoverable = getNewestRecoverableVersion(versions);
      const latest =
        versions.find((row) => row.is_latest) ||
        [...versions].sort(byLastModifiedDesc)[0];
      return {
        name,
        bytes: recoverable ? recoverable.bytes : 0,
        hash: recoverable ? recoverable.hash : undefined,
        last_modified: latest && latest.last_modified,
        content_type: latest && latest.content_type,
        isDeleted: true,
        canRestore: !!recoverable,
        restoreVersionId: recoverable ? getVersionId(recoverable) : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};
