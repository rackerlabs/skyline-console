// Copyright 2021 99cloud
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

export const isFile = (item) => item && item.type === 'file';
export const isFolder = (item) => item && item.type === 'folder';

// Matches Glance's default multi-tenant naming; a heuristic, not proof.
export const isGlanceContainer = (name) =>
  typeof name === 'string' &&
  /^glance_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    name
  );

export const getGlanceStorageWarning = () =>
  t(
    'This container may contain Glance image data. Deleting it or its contents may make the associated images unusable. Manage images through Compute > Images.'
  );

export const getFreezerStorageWarning = () =>
  t(
    'This container may contain Freezer backup data. Deleting it or its contents may prevent restores or disrupt scheduled backups. Manage backups through Backup & Restore.'
  );

export const getCinderBackupStorageWarning = () =>
  t(
    'This container may contain Cinder volume backup data. Deleting it or its contents may prevent the associated backups from being restored. Manage volume backups through Storage > Volume Backups.'
  );

export const getTroveBackupStorageWarning = () =>
  t(
    'This container may contain Trove database backup data. Deleting it or its contents may prevent the associated backups from being restored. Manage database backups through Database > Backups.'
  );

export const getSwiftStorageWarnings = (
  container,
  { isFreezerContainer = false } = {}
) => {
  const warnings = [];
  if (isGlanceContainer(container)) {
    warnings.push(getGlanceStorageWarning());
  }
  if (isFreezerContainer) {
    warnings.push(getFreezerStorageWarning());
  }
  if (container === 'volumebackups') {
    warnings.push(getCinderBackupStorageWarning());
  }
  if (container === 'database_backups') {
    warnings.push(getTroveBackupStorageWarning());
  }
  return warnings;
};
