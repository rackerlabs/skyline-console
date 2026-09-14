import registry from 'resources/skyline/features.json';

// Missing and null values are enabled. Only deployment's boolean false hides UI.
export const isFeatureEnabled = (features, key) => {
  if (!key) return true;
  const { parent } = registry[key] || {};
  return (
    (features || {})[key] !== false &&
    (!parent || isFeatureEnabled(features, parent))
  );
};

// Admin and Basic use the same panel flags as the Advanced project console.
const normalizePath = (path) =>
  path.replace(/^\/basic\//, '/').replace(/-admin(?=\/|$)/g, '');

export const getPathFeatures = (path) => {
  if (typeof path !== 'string') return [];
  const normalized = normalizePath(path);
  const segments = normalized.split('/');
  return Object.keys(registry).filter((key) =>
    (registry[key].paths || []).some((prefix) =>
      prefix
        .split('/')
        .every((part, index) =>
          part.startsWith(':') ? !!segments[index] : part === segments[index]
        )
    )
  );
};

export const isPathEnabled = (features, path) =>
  getPathFeatures(path).every((key) => isFeatureEnabled(features, key));

export const filterFeatureMenu = (menu, features) =>
  menu.reduce((result, item) => {
    if (!isPathEnabled(features, item.routePath || item.path)) return result;
    const children = item.children
      ? filterFeatureMenu(item.children, features)
      : undefined;
    // Remove section headings when all panels have disappeared, but preserve
    // panels whose children are only optional detail/create breadcrumb entries.
    if (item.level === undefined && item.children && !children.length) {
      return result;
    }
    result.push({ ...item, ...(children ? { children } : {}) });
    return result;
  }, []);
