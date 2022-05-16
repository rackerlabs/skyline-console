export const shareStatus = {
  creating: t('Creating'),
  creating_from_snapshot: t('Creating From Snapshot'),
  deleting: t('Deleting'),
  deleted: t('Deleted'),
  error: t('Error'),
  error_deleting: t('Error Deleting'),
  available: t('Available'),
  inactive: t('Inactive'),
  manage_starting: t('Manage Starting'),
  manage_error: t('Manage Error'),
  unmanage_starting: t('Unmanage Starting'),
  unmanage_error: t('Unmanage Error'),
  unmanaged: t('Unmanaged'),
  extending: t('Extending'),
  extending_error: t('Extending Error'),
  shrinking: t('Shrinking'),
  shrinking_error: t('Shrinking Error'),
  shrinking_possible_data_loss_error: t('Shrinking Possible Data Loss Error'),
  migrating: t('Migrating'),
  migrating_to: t('Migrating To'),
  replication_change: t('Replication Change'),
  reverting: t('Reverting'),
  reverting_error: t('Reverting Error'),
};

export const accessRuleStatus = {
  active: t('Active'),
  error: t('Error'),
  syncing: t('Syncing'),
};

export const replicaState = {
  active: t('Active'),
  error: t('Error'),
  in_sync: t('Syncing'),
  out_of_sync: t('Out of Sync'),
};

export const shareProtocol = {
  NFS: t('NFS'),
  CIFS: t('CIFS'),
  GlusterFS: t('GlusterFS'),
  HDFS: t('HDFS'),
  CephFS: t('CephFS'),
  MAPRFS: t('MAPRFS'),
};

export const shareVisibility = {
  public: t('Public'),
  private: t('Private'),
};

export const shareAccessRuleState = {
  new: t('New'),
  active: t('Active'),
  error: t('Error'),
  queued_to_apply: t('Queued To Apply'),
  queued_to_deny: t('Queued To Deny'),
  denying: t('Denying'),
  applying: t('Applying'),
};