// Copyright 2022 99cloud
//
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

export const clusterStatus = {
  CREATE_IN_PROGRESS: t('CREATE IN PROGRESS'),
  CREATE_COMPLETE: t('CREATE COMPLETE'),
  CREATE_FAILED: t('CREATE FAILED'),
  UPDATE_IN_PROGRESS: t('UPDATE IN PROGRESS'),
  UPDATE_COMPLETE: t('UPDATE COMPLETE'),
  UPDATE_FAILED: t('UPDATE FAILED'),
  DELETE_IN_PROGRESS: t('DELETE_IN PROGRESS'),
  DELETE_COMPLETE: t('DELETE COMPLETE'),
  DELETE_FAILED: t('DELETE FAILED'),
  RESUME_COMPLETE: t('RESUME COMPLETE'),
  RESUME_FAILED: t('RESUME FAILED'),
  RESTORE_COMPLETE: t('RESTORE COMPLETE'),
  ROLLBACK_IN_PROGRESS: t('ROLLBACK IN PROGRESS'),
  ROLLBACK_COMPLETE: t('ROLLBACK COMPLETE'),
  ROLLBACK_FAILED: t('ROLLBACK FAILED'),
  SNAPSHOT_COMPLETE: t('SNAPSHOT COMPLETE'),
  CHECK_COMPLETE: t('CHECK COMPLETE'),
  ADOPT_COMPLETE: t('ADOPT COMPLETE'),
};

export const healthStatus = {
  HEALTHY: t('HEALTHY'),
  UNHEALTHY: t('UNHEALTHY'),
  UNKNOWN: t('UNKNOWN'),
};

export const defaultTip = t(
  'If it’s not set, the value of this in the template will be used.'
);

// The min_node_count label is required when auto scaling is enabled, and must
// be at least 2. max_node_count is the autoscaler ceiling.
export const MIN_NODE_COUNT_KEY = 'min_node_count';
export const MIN_NODE_COUNT_VALUE = '2';
export const MAX_NODE_COUNT_KEY = 'max_node_count';

// Preset labels that a user can add to a cluster / cluster template with a
// single click. Keep values as strings, since Magnum labels are string map.
export const presetLabels = [
  { key: 'auto_scaling_enabled', value: 'true' },
  { key: 'max_node_count', value: '5' },
  { key: 'auto_healing_enabled', value: 'true' },
  { key: 'monitoring_enabled', value: 'true' },
  { key: 'cinder_csi_enabled', value: 'true' },
  { key: 'kube_dashboard_enabled', value: 'true' },
];
