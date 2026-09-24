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

// A cluster may only be upgraded while it reports this health status.
export const CLUSTER_UPGRADE_HEALTH_STATUS = 'HEALTHY';

// Glance image property that carries the Kubernetes version baked into the
// image. The version a cluster template upgrades to is derived from it.
export const KUBE_VERSION_PROPERTY = 'kube_version';

/**
 * Parse a Kubernetes version string such as `v1.34.3` or `1.34` into its
 * numeric parts. Returns null when the value can not be parsed.
 */
export const parseKubeVersion = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const matched = value.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!matched) {
    return null;
  }
  const [, major, minor, patch] = matched;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: patch === undefined ? 0 : Number(patch),
  };
};

/**
 * Read the Kubernetes version from a Glance image as returned by the image
 * store. The store keeps the untouched API payload under `originData`, custom
 * image properties live at the top level of that payload.
 */
export const getImageKubeVersion = (image) => {
  if (!image) {
    return '';
  }
  const { originData = {} } = image;
  return (
    originData[KUBE_VERSION_PROPERTY] || image[KUBE_VERSION_PROPERTY] || ''
  );
};

/**
 * The `image_id` of a cluster template may hold either the image UUID or the
 * image name, so both are matched.
 */
export const findImageByIdOrName = (images = [], idOrName) => {
  if (!idOrName) {
    return null;
  }
  return (
    images.find((it) => it.id === idOrName || it.name === idOrName) || null
  );
};

/**
 * Decide whether a cluster running `currentVersion` may be upgraded to
 * `targetVersion`.
 *
 * - the target must be strictly newer, upgrading to the running version is
 *   rejected (v1.34.3 -> v1.34.3)
 * - patch level increases within the same minor version are allowed
 *   (v1.34.3 -> v1.34.6)
 * - exactly one minor version step is allowed (v1.34.3 -> v1.35.0)
 * - skipping minor versions is rejected (v1.34.3 -> v1.36.0)
 * - any downgrade is rejected (v1.34.3 -> v1.33.7, v1.34.6 -> v1.34.3)
 *
 * Returns `{ allowed, tag, reason }`. `tag` is a short label for the option
 * list, `reason` is the full message shown when the selection is rejected.
 */
export const getClusterUpgradePathCheck = (currentVersion, targetVersion) => {
  const current = parseKubeVersion(currentVersion);
  const target = parseKubeVersion(targetVersion);

  if (!current) {
    return {
      allowed: false,
      tag: t('unknown cluster version'),
      reason: t(
        'The current Kubernetes version of the cluster is unknown, so the upgrade path can not be verified.'
      ),
    };
  }

  if (!target) {
    return {
      allowed: false,
      tag: t('unknown version'),
      reason: t(
        'The Kubernetes version of this cluster template is unknown. Make sure the image it uses has the kube_version property set.'
      ),
    };
  }

  const compared =
    target.major - current.major ||
    target.minor - current.minor ||
    target.patch - current.patch;

  if (compared === 0) {
    return {
      allowed: false,
      tag: t('current version'),
      reason: t('The cluster already runs {version}.', {
        version: targetVersion,
      }),
    };
  }

  if (compared < 0) {
    return {
      allowed: false,
      tag: t('downgrade'),
      reason: t(
        'Downgrading a cluster from {current} to {target} is not supported.',
        {
          current: currentVersion,
          target: targetVersion,
        }
      ),
    };
  }

  if (target.major > current.major) {
    return {
      allowed: false,
      tag: t('major version skipped'),
      reason: t('Upgrading across major versions is not supported.'),
    };
  }

  if (target.minor - current.minor > 1) {
    return {
      allowed: false,
      tag: t('version skipped'),
      reason: t(
        'Minor versions can not be skipped. Upgrade to {next} first, then continue to {target}.',
        {
          next: `v${current.major}.${current.minor + 1}`,
          target: targetVersion,
        }
      ),
    };
  }

  return { allowed: true, tag: '', reason: '' };
};

export const defaultTip = t(
  'If it’s not set, the value of this in the template will be used.'
);

// The min_node_count label is required when auto scaling is enabled, and must
// be at least 2. max_node_count is the autoscaler ceiling.
export const MIN_NODE_COUNT_KEY = 'min_node_count';
export const MIN_NODE_COUNT_VALUE = '2';
export const MAX_NODE_COUNT_KEY = 'max_node_count';
