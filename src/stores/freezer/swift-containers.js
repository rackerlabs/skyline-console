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

import client from 'client';
import { freezerEndpoint, swiftEndpoint } from 'client/client/constants';
import globalRootStore from 'stores/root';

const getScope = () => ({
  projectId: globalRootStore.user?.project?.id,
  region: globalRootStore.user?.region,
  freezer: freezerEndpoint(),
  swift: swiftEndpoint(),
});

const sameScope = (scope) => {
  const current = getScope();
  return Object.keys(scope).every((key) => scope[key] === current[key]);
};

// Not cached: each lookup reflects the current project/region/endpoints.
export const fetchFreezerContainers = async () => {
  const scope = getScope();
  const containers = new Set();
  if (!scope.projectId || !scope.freezer || !scope.swift) {
    return containers;
  }

  const addReference = (config) => {
    if (
      !config ||
      config.storage !== 'swift' ||
      typeof config.container !== 'string' ||
      // Native Cinder backups require checking Cinder's actual backup driver.
      config.mode === 'cindernative' ||
      config.backup_media === 'cindernative'
    ) {
      return;
    }
    // Use the container (first path component) plus its segmented-backup
    // "<container>_segments" sibling; a marker only shows if either exists.
    const [name] = config.container.split('/');
    if (name) {
      containers.add(name);
      containers.add(`${name}_segments`);
    }
  };

  const readReferences = async (resource) => {
    const limit = 100;
    let offset = 0;
    try {
      while (sameScope(scope)) {
        // eslint-disable-next-line no-await-in-loop
        const result = await client.freezer[resource].list(
          { limit, offset },
          { timeout: 10000 }
        );
        const records = result?.[resource];
        if (!Array.isArray(records) || !records.length) {
          break;
        }
        records.forEach((record) => {
          // Admin job listings may span projects despite the project URL.
          if (
            (resource === 'jobs' && record.project_id !== scope.projectId) ||
            (record.project_id && record.project_id !== scope.projectId)
          ) {
            return;
          }
          if (resource === 'backups') {
            addReference(record.backup_metadata);
          } else if (resource === 'actions') {
            addReference(record.freezer_action);
          } else {
            (record.job_actions || []).forEach((action) =>
              addReference(action.freezer_action)
            );
          }
        });
        if (records.length < limit) {
          break;
        }
        offset += records.length;
      }
    } catch (error) {
      // Freezer is optional; a read failure must not block Object Storage.
    }
  };

  await Promise.all(['backups', 'actions', 'jobs'].map(readReferences));
  return sameScope(scope) ? containers : new Set();
};
