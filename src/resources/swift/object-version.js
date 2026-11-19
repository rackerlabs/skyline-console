export const getVersionId = (row) => String(row.version_id);

export const isDeleteMarker = (row) =>
  (row.content_type || '').toLowerCase().replace(/\s/g, '') ===
  'application/x-deleted;swift_versions_deleted=1';

export const getVersionKey = (row) =>
  JSON.stringify([row.name, getVersionId(row)]);

export const mergeObjectVersions = (previous, page, name) => {
  const versions = new Map();
  [...previous, ...page].forEach((row) => {
    if (row.name === name) {
      versions.set(getVersionKey(row), row);
    }
  });
  return [...versions.values()].sort((a, b) =>
    b.last_modified.localeCompare(a.last_modified)
  );
};

export const getObjectVersionMetadata = (headers = {}, fallbackSize) => {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
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
