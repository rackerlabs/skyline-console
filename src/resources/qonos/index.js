export const ACTION_TYPES = {
  SERVER_SNAPSHOT: 'server_snapshot',
};

export const actionTypeOptions = [
  {
    label: t('Server Snapshot'),
    value: ACTION_TYPES.SERVER_SNAPSHOT,
  },
];

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
  const policy = {};
  const { retention_count_enabled, retention_count } = values;
  const { retention_age_enabled, retention_age_days } = values;
  if (retention_count_enabled && retention_count) {
    policy.count = Number(retention_count);
  }
  if (retention_age_enabled && retention_age_days) {
    policy.age_seconds = Number(retention_age_days) * 24 * 60 * 60;
  }
  return Object.keys(policy).length ? policy : undefined;
};

export const parseRetentionPolicy = (policy = {}) => ({
  retention_count_enabled: !!policy.count,
  retention_count: policy.count,
  retention_age_enabled: !!policy.age_seconds,
  retention_age_days: policy.age_seconds
    ? Math.ceil(Number(policy.age_seconds) / (24 * 60 * 60))
    : undefined,
});

export const formatRetentionPolicy = (policy = {}) => {
  const result = [];
  if (policy.count) {
    result.push(t('{count} item(s)', { count: policy.count }));
  }
  if (policy.age_seconds) {
    const days = Math.ceil(Number(policy.age_seconds) / (24 * 60 * 60));
    result.push(t('{days} day(s)', { days }));
  }
  return result.length ? result.join(', ') : '-';
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
  const serverId = getSelectedId(values.server);
  const executionProfileId = getSelectedId(values.execution_profile);
  const body = {
    name: values.name,
    description: values.description,
    cron_expression: values.cron_expression,
    action_parameters: {
      server_id: serverId || values.server_id,
    },
    webhook_url: values.webhook_url,
    retention_policy: buildRetentionPolicy(values),
    execution_profile_id: executionProfileId || values.execution_profile_id,
    enabled: values.enabled,
  };
  if (!isEdit) {
    body.action_type = ACTION_TYPES.SERVER_SNAPSHOT;
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
  const serverId = actionParameters.server_id;
  const retention = parseRetentionPolicy(item.retention_policy);
  return {
    name: item.name,
    description: item.description,
    action_type: ACTION_TYPES.SERVER_SNAPSHOT,
    cron_preset: getCronPreset(item.cron_expression),
    cron_expression: item.cron_expression,
    server: serverId
      ? {
          selectedRowKeys: [serverId],
          selectedRows: [{ id: serverId, name: serverId }],
        }
      : undefined,
    server_id: serverId,
    execution_profile: item.execution_profile_id
      ? {
          selectedRowKeys: [item.execution_profile_id],
          selectedRows: [
            {
              id: item.execution_profile_id,
              name: item.execution_profile_id,
            },
          ],
        }
      : undefined,
    execution_profile_id: item.execution_profile_id,
    webhook_url: item.webhook_url,
    enabled: item.enabled === undefined ? true : item.enabled,
    ...retention,
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

export const buildRunNowBody = (schedule) => ({
  schedule_id: schedule.id,
});
