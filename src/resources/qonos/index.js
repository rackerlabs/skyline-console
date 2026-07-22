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

export const cronPresetOptions = [
  {
    label: t('Daily at midnight'),
    value: '0 0 * * *',
  },
  {
    label: t('Daily at 2:00'),
    value: '0 2 * * *',
  },
  {
    label: t('Every 6 hours'),
    value: '0 */6 * * *',
  },
  {
    label: t('Weekly on Sunday'),
    value: '0 0 * * 0',
  },
  {
    label: t('Custom'),
    value: 'custom',
  },
];

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

export const executableJobStatuses = ['QUEUED', 'PROCESSING'];

export const getCronPreset = (cronExpression) => {
  const preset = cronPresetOptions.find((it) => it.value === cronExpression);
  return preset ? preset.value : 'custom';
};

export const validateCronExpression = (value) => {
  if (!value) {
    return t('Please input Cron Expression!');
  }
  const fields = value.trim().split(/\s+/);
  if (fields.length !== 5) {
    return t('Cron expression must contain five fields.');
  }
  return '';
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

export const buildExecutionProfileBody = (values = {}) => {
  const { name, description, trust_id, enabled = true } = values;
  return {
    name,
    description,
    auth_type: 'trust',
    trust_id,
    enabled,
  };
};

export const buildScheduleBody = (values = {}, isEdit = false) => {
  const body = {
    name: values.name,
    description: values.description,
    cron_expression: values.cron_expression,
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
    cron_preset: getCronPreset(item.cron_expression),
    cron_expression: item.cron_expression,
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
    role_name = 'member',
    impersonation = false,
    expires_at,
  } = values;
  const trust = {
    trustor_user_id,
    trustee_user_id,
    project_id,
    roles: [{ name: role_name }],
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
