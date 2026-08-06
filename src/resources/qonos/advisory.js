let lastQonosAdvisory = null;

export const setLastQonosAdvisory = (value) => {
  lastQonosAdvisory = value || null;
};

export const notifyQonosAdvisory = () => {
  const advisory = lastQonosAdvisory;
  lastQonosAdvisory = null;
  if (!advisory) {
    return;
  }
  const Notify = require('components/Notify').default;
  Notify.warn(
    t('Schedule advisory'),
    String(advisory)
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .join('\n')
  );
};

export const withQonosAdvisory = (promise) => {
  lastQonosAdvisory = null;
  return Promise.resolve(promise).then((result) => {
    notifyQonosAdvisory();
    return result;
  });
};
