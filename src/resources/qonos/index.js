import moment from 'moment';

export const ACTION_TYPES = {
  SERVER_SNAPSHOT: 'server_snapshot',
  VOLUME_BACKUP_FULL: 'volume_backup_full',
  VOLUME_BACKUP_INCREMENTAL: 'volume_backup_incremental',
};

export const actionTypeOptions = [
  {
    label: t('Server Snapshot'),
    value: ACTION_TYPES.SERVER_SNAPSHOT,
  },
  {
    label: t('Volume Backup Full'),
    value: ACTION_TYPES.VOLUME_BACKUP_FULL,
  },
  {
    label: t('Volume Backup Incremental'),
    value: ACTION_TYPES.VOLUME_BACKUP_INCREMENTAL,
  },
];

export const isServerSnapshotAction = (actionType) =>
  actionType === ACTION_TYPES.SERVER_SNAPSHOT;

export const isVolumeBackupAction = (actionType) =>
  actionType === ACTION_TYPES.VOLUME_BACKUP_FULL ||
  actionType === ACTION_TYPES.VOLUME_BACKUP_INCREMENTAL;

export const getVolumeBackupActionTip = (actionType) => {
  if (actionType === ACTION_TYPES.VOLUME_BACKUP_INCREMENTAL) {
    return t(
      'Incremental backups need a successful full backup first. Add a volume_backup_full schedule for this volume, or ensure a full backup already exists.'
    );
  }
  return undefined;
};

export const getScheduleCreatePath = (isAdminPage) =>
  isAdminPage
    ? '/scheduled-actions/schedule-admin/create'
    : '/scheduled-actions/schedule/create';

export const executionProfileColumns = [
  { title: t('Name'), dataIndex: 'name' },
  { title: t('Trust ID'), dataIndex: 'trust_id' },
  { title: t('Enabled'), dataIndex: 'enabled', valueRender: 'yesNo' },
];

export const mapActionTarget = (data = {}) => {
  const actionParameters = data.action_parameters || {};
  return {
    server_id: actionParameters.server_id,
    volume_id: actionParameters.volume_id,
    target_id: actionParameters.server_id || actionParameters.volume_id,
  };
};

const toSelected = (id) =>
  id ? { selectedRowKeys: [id], selectedRows: [{ id, name: id }] } : undefined;

export const SCHEDULE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

const scheduleFrequencyOptions = [
  [t('Daily'), SCHEDULE_FREQUENCIES.DAILY],
  [t('Weekly'), SCHEDULE_FREQUENCIES.WEEKLY],
  [t('Monthly'), SCHEDULE_FREQUENCIES.MONTHLY],
].map(([label, value]) => ({ label, value }));

const weekDayOptions = [
  t('Sunday'),
  t('Monday'),
  t('Tuesday'),
  t('Wednesday'),
  t('Thursday'),
  t('Friday'),
  t('Saturday'),
].map((label, value) => ({ label, value: `${value}` }));

const monthDayOptions = Array.from({ length: 31 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

export const getDefaultScheduleTiming = () => ({
  schedule_frequency: SCHEDULE_FREQUENCIES.DAILY,
  schedule_week_days: {},
  schedule_month_days: [],
  schedule_time: moment().startOf('day'),
});

export const enabledStatus = {
  true: t('Enabled'),
  false: t('Disabled'),
};

export const jobStatus = {
  QUEUED: t('Queued'),
  PROCESSING: t('Processing'),
  DONE: t('Done'),
  TIMED_OUT: t('Timed Out'),
  ERROR: t('Error'),
  CANCELLED: t('Cancelled'),
  HARD_TIMED_OUT: t('Hard Timed Out'),
  MAX_RETRIED: t('Max Retried'),
};

export const getJobStatusReason = (record = {}) => {
  if (!record || record.status === 'DONE') {
    return '';
  }
  return record.error_message || '';
};

export const executableJobStatuses = ['QUEUED', 'PROCESSING'];

const byNumber = (a, b) => Number(a) - Number(b);

const getCheckedKeys = (value = {}) =>
  Object.keys(value)
    .filter((key) => value[key])
    .sort(byNumber);

export const buildCronExpression = (values = {}) => {
  const time = values.schedule_time;
  const minute = time ? time.minutes() : 0;
  const hour = time ? time.hours() : 0;
  const frequency = values.schedule_frequency || SCHEDULE_FREQUENCIES.DAILY;
  if (frequency === SCHEDULE_FREQUENCIES.WEEKLY) {
    const days = getCheckedKeys(values.schedule_week_days).join(',') || '0';
    return `${minute} ${hour} * * ${days}`;
  }
  if (frequency === SCHEDULE_FREQUENCIES.MONTHLY) {
    const days =
      [...(values.schedule_month_days || [])].sort(byNumber).join(',') || '1';
    return `${minute} ${hour} ${days} * *`;
  }
  return `${minute} ${hour} * * *`;
};

const parseCronField = (field, max) => {
  if (field === '*') return [];
  const parts = (field || '').split(',').map((it) => it.trim());
  return parts.every((it) => /^\d+$/.test(it) && Number(it) <= max)
    ? parts
    : null;
};

export const parseCronExpression = (cronExpression) => {
  const defaults = getDefaultScheduleTiming();
  const fields = (cronExpression || '').trim().split(/\s+/);
  if (fields.length !== 5) return defaults;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  const monthDays = parseCronField(dayOfMonth, 31);
  const weekDays = parseCronField(dayOfWeek, 7);
  if (
    !/^\d+$/.test(minute) ||
    !/^\d+$/.test(hour) ||
    month !== '*' ||
    monthDays === null ||
    weekDays === null
  ) {
    return defaults;
  }
  const schedule_time = moment()
    .startOf('day')
    .hours(Number(hour))
    .minutes(Number(minute));
  if (weekDays.length) {
    return {
      ...defaults,
      schedule_frequency: SCHEDULE_FREQUENCIES.WEEKLY,
      schedule_time,
      schedule_week_days: Object.fromEntries(
        weekDays.map((day) => [`${Number(day) % 7}`, true])
      ),
    };
  }
  if (monthDays.length) {
    return {
      ...defaults,
      schedule_frequency: SCHEDULE_FREQUENCIES.MONTHLY,
      schedule_time,
      schedule_month_days: monthDays,
    };
  }
  return { ...defaults, schedule_time };
};

export const getScheduleTimingFormItems = (frequency) => {
  const isWeekly = frequency === SCHEDULE_FREQUENCIES.WEEKLY;
  const isMonthly = frequency === SCHEDULE_FREQUENCIES.MONTHLY;
  return [
    {
      name: 'schedule_frequency',
      label: t('Frequency'),
      type: 'radio',
      options: scheduleFrequencyOptions,
      required: true,
    },
    {
      name: 'schedule_week_days',
      label: t('Days of Week'),
      type: 'check-group',
      options: weekDayOptions,
      span: 6,
      required: isWeekly,
      hidden: !isWeekly,
      validator: (rule, value) =>
        getCheckedKeys(value).length
          ? Promise.resolve()
          : Promise.reject(new Error(t('Please select at least one day.'))),
    },
    {
      name: 'schedule_month_days',
      label: t('Days of Month'),
      type: 'select',
      mode: 'multiple',
      options: monthDayOptions,
      required: isMonthly,
      hidden: !isMonthly,
      placeholder: t('Please select days of the month'),
      extra: t(
        'If a selected day does not exist in a month (for example 31 in April), the schedule is skipped that month.'
      ),
    },
    {
      name: 'schedule_time',
      label: t('Time'),
      type: 'time-picker',
      format: 'HH:mm',
      allowClear: false,
      required: true,
      extra: t('All schedule times are UTC.'),
    },
  ];
};

export const webhookUrlValidator = (rule, value) => {
  if (!value) {
    return Promise.resolve();
  }
  try {
    const { protocol } = new URL(value);
    if (protocol === 'http:' || protocol === 'https:') {
      return Promise.resolve();
    }
  } catch (e) {
    // invalid URL
  }
  return Promise.reject(
    new Error(t('Please enter a valid URL (http:// or https://).'))
  );
};

export const buildRetentionPolicy = (values = {}) => {
  const {
    retention_type,
    retention_count_enabled,
    retention_count,
    retention_age_enabled,
    retention_age_days,
  } = values;
  const type =
    retention_type ||
    (retention_count_enabled && 'count') ||
    (retention_age_enabled && 'age') ||
    'none';
  if (type === 'count' && retention_count) {
    return { type: 'count', value: Number(retention_count) };
  }
  if (type === 'age' && retention_age_days) {
    return { type: 'age', max_age_days: Number(retention_age_days) };
  }
  return undefined;
};

const getRetentionCount = (policy) => {
  if (!policy || typeof policy !== 'object') {
    return undefined;
  }
  if (policy.type === 'count' && policy.value != null) {
    return Number(policy.value);
  }
  if (policy.count != null) {
    return Number(policy.count);
  }
  return undefined;
};

const getRetentionAgeDays = (policy) => {
  if (!policy || typeof policy !== 'object') {
    return undefined;
  }
  if (policy.type === 'age' && policy.max_age_days != null) {
    return Number(policy.max_age_days);
  }
  if (policy.max_age_days != null && policy.type !== 'count') {
    return Number(policy.max_age_days);
  }
  return undefined;
};

export const retentionTypeOptions = [
  { label: t('None'), value: 'none' },
  { label: t('Count'), value: 'count' },
  { label: t('Age'), value: 'age' },
];

export const parseRetentionPolicy = (policy) => {
  const count = getRetentionCount(policy);
  const ageDays = getRetentionAgeDays(policy);
  let retention_type = 'none';
  if (count != null) {
    retention_type = 'count';
  } else if (ageDays != null) {
    retention_type = 'age';
  }
  return {
    retention_type,
    retention_count_enabled: retention_type === 'count',
    retention_count: count,
    retention_age_enabled: retention_type === 'age',
    retention_age_days: ageDays,
  };
};

export const formatRetentionPolicy = (policy) => {
  if (!policy) {
    return '-';
  }
  const count = getRetentionCount(policy);
  if (count != null) {
    return t('Keep last {count} snapshot(s)/backup(s)', { count });
  }
  const days = getRetentionAgeDays(policy);
  if (days != null) {
    return t('Keep for {days} day(s)', { days });
  }
  return '-';
};

export const getSelectedId = (value) => {
  const { selectedRowKeys = [] } = value || {};
  return selectedRowKeys[0];
};

export const normalizeTrustId = (id) => {
  if (!id) {
    return id;
  }
  const raw = String(id).trim().split(/\s+/)[0];
  return raw.replace(/-/g, '');
};

export const fetchExecutionProfilesForProject = async (
  profileStore,
  trustorUserId,
  projectId
) => {
  const { TrustStore } = require('stores/keystone/trust');
  profileStore.list.data = [];
  profileStore.list.isLoading = true;
  try {
    const trusts = await fetchTrustsForQonosTrustee(
      new TrustStore(),
      trustorUserId,
      projectId
    );
    const trustIds = new Set(
      (trusts || []).map((t) => normalizeTrustId(t.id)).filter(Boolean)
    );
    const allProfiles = await profileStore.requestList(
      profileStore.paramsFunc({}),
      {}
    );
    const items = (allProfiles || []).filter((ep) =>
      trustIds.has(normalizeTrustId(ep.trust_id))
    );
    profileStore.list.data = items;
    profileStore.list.total = items.length;
    return items;
  } catch (e) {
    profileStore.list.data = [];
    profileStore.list.total = 0;
    return [];
  } finally {
    profileStore.list.isLoading = false;
  }
};

export const trustHasEnabledExecutionProfile = async (trustId) => {
  if (!trustId) {
    return false;
  }
  const { ExecutionProfileStore } = require('stores/qonos/execution-profile');
  const store = new ExecutionProfileStore();
  await store.fetchList({ enabled: true });
  const normalized = normalizeTrustId(trustId);
  return (store.list.data || []).some(
    (ep) => !!ep.enabled && normalizeTrustId(ep.trust_id) === normalized
  );
};

export const executionProfileHasEnabledSchedule = async (profileId) => {
  if (!profileId) {
    return false;
  }
  const { ScheduleStore } = require('stores/qonos/schedule');
  const store = new ScheduleStore();
  await store.fetchList({});
  const normalized = normalizeTrustId(profileId);
  return (store.list.data || []).some(
    (schedule) =>
      !!schedule.enabled &&
      normalizeTrustId(schedule.execution_profile_id) === normalized
  );
};

export const buildExecutionProfileBody = (values = {}) => {
  const { name, description, trust_id, enabled = true } = values;
  const body = {
    name,
    auth_type: 'trust',
    trust_id: normalizeTrustId(trust_id),
    enabled: !!enabled,
  };
  if (description) {
    body.description = description;
  }
  return body;
};

export const buildScheduleBody = (values = {}, isEdit = false) => {
  const body = {
    name: values.name,
    description: values.description,
    cron_expression: buildCronExpression(values),
    webhook_url: values.webhook_url,
    retention_policy: buildRetentionPolicy(values),
  };
  if (!isEdit) {
    const serverId = getSelectedId(values.server);
    const volumeId = getSelectedId(values.volume);
    const executionProfileId = getSelectedId(values.execution_profile);
    const actionType = values.action_type || ACTION_TYPES.SERVER_SNAPSHOT;
    body.action_type = actionType;
    body.action_parameters = isVolumeBackupAction(actionType)
      ? { volume_id: volumeId || values.volume_id }
      : { server_id: serverId || values.server_id };
    body.execution_profile_id =
      executionProfileId || values.execution_profile_id;
    body.enabled = values.enabled;
  }
  Object.keys(body).forEach((key) => {
    if (body[key] === undefined || body[key] === '') {
      delete body[key];
    }
  });
  return body;
};

export const getScheduleDefaultValue = (item = {}) => {
  const { action_parameters: actionParameters = {} } = item;
  const actionType = item.action_type || ACTION_TYPES.SERVER_SNAPSHOT;
  const serverId = actionParameters.server_id;
  const volumeId = actionParameters.volume_id;
  return {
    name: item.name,
    description: item.description,
    action_type: actionType,
    ...parseCronExpression(item.cron_expression),
    server: toSelected(serverId),
    server_id: serverId,
    volume: toSelected(volumeId),
    volume_id: volumeId,
    execution_profile: toSelected(item.execution_profile_id),
    execution_profile_id: item.execution_profile_id,
    webhook_url: item.webhook_url,
    enabled: item.enabled === undefined ? true : item.enabled,
    ...parseRetentionPolicy(item.retention_policy),
  };
};

export const buildTrustBody = (values = {}, currentUser = {}) => {
  const { project: { id: projectId } = {}, user: { id: currentUserId } = {} } =
    currentUser || {};
  const {
    trustor_user_id = currentUserId,
    trustee_user_id,
    project_id = projectId,
    roles = [],
    impersonation = false,
    expires_at,
  } = values;
  const roleIds = (Array.isArray(roles) ? roles : [roles]).filter(Boolean);
  const trust = {
    trustor_user_id,
    trustee_user_id,
    project_id,
    roles: roleIds.map((id) => ({ id })),
    impersonation,
  };
  if (expires_at) {
    trust.expires_at =
      expires_at && expires_at.format ? expires_at.utc().format() : expires_at;
  }
  return {
    trust,
  };
};

export const resolveQonosUserId = () => {
  const globalRootStore = require('stores/root').default;
  return globalRootStore.user?.qonos_user_id || undefined;
};

export const fetchTrustsForQonosTrustee = async (
  trustStore,
  trustorUserId,
  projectId,
  { withRoles = false } = {}
) => {
  const qonosId = resolveQonosUserId();
  trustStore.list.data = [];
  if (!trustorUserId) {
    trustStore.list.isLoading = false;
    return [];
  }
  trustStore.list.isLoading = true;
  try {
    const params = trustStore.paramsFunc({ trustor_user_id: trustorUserId });
    const allData = await trustStore.requestList(params, {
      trustor_user_id: trustorUserId,
      skipRoleFetch: true,
    });
    let items = (allData || []).filter((t) => {
      if (t.trustor_user_id !== trustorUserId) {
        return false;
      }
      if (projectId && t.project_id !== projectId) {
        return false;
      }
      if (qonosId && t.trustee_user_id !== qonosId) {
        return false;
      }
      return true;
    });
    if (withRoles && items.length) {
      items = await Promise.all(
        items.map(async (item) => {
          if (item.roles && item.roles.length) {
            return item;
          }
          try {
            const result = await trustStore.client.show(item.id);
            const trust = result?.trust || result || {};
            return {
              ...item,
              roles: trust.roles || [],
            };
          } catch (e) {
            return item;
          }
        })
      );
    }
    trustStore.list.data = items;
    trustStore.list.total = items.length;
    return items;
  } finally {
    trustStore.list.isLoading = false;
  }
};
