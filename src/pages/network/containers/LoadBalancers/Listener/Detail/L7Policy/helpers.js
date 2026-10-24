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

import {
  buildL7PolicyPayload,
  l7PolicyRedirectHttpCodes,
  validateL7Policy,
} from 'resources/octavia/l7policy';

export { actionLabels } from 'resources/octavia/l7policy';

export const supportsL7Policies = (listener = {}) =>
  ['HTTP', 'TERMINATED_HTTPS'].includes(listener.protocol) &&
  listener.loadBalancer?.provider !== 'ovn';

export const canChangePolicies = (listener = {}) =>
  supportsL7Policies(listener) &&
  listener.provisioning_status === 'ACTIVE' &&
  listener.loadBalancer?.provisioning_status === 'ACTIVE';

export const canChangePolicy = (policy = {}, listener = {}, deleting = false) =>
  canChangePolicies(listener) &&
  policy.listener_id === listener.id &&
  (deleting ? ['ACTIVE', 'ERROR'] : ['ACTIVE']).includes(
    policy.provisioning_status
  );

export const isPending = (item = {}) =>
  ['PENDING_CREATE', 'PENDING_UPDATE', 'PENDING_DELETE'].includes(
    item.provisioning_status
  );

export const eligibleRedirectPools = (pools, listener = {}) => {
  const { loadBalancer = {}, project_id: projectId } = listener;
  if (!supportsL7Policies(listener) || !loadBalancer.id || !projectId) {
    return [];
  }
  // Octavia's VALID_LISTENER_POOL_PROTOCOL_MAP permits these for HTTP and TLS termination.
  return pools.filter(
    (pool) =>
      pool.project_id === projectId &&
      (pool.loadbalancers || []).some(({ id }) => id === loadBalancer.id) &&
      ['HTTP', 'PROXY', 'PROXYV2'].includes(pool.protocol) &&
      pool.provisioning_status === 'ACTIVE'
  );
};

export const positionError = (value) =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  (!Number.isInteger(value) || value < 1 || value > 2147483647)
    ? t('Enter a whole number from 1 to 2147483647.')
    : '';

export const policyPayload = (values) => {
  const errors = validateL7Policy(values);
  if (
    values.action === 'REDIRECT_TO_URL' &&
    values.redirect_http_code !== undefined &&
    !l7PolicyRedirectHttpCodes.includes(values.redirect_http_code)
  ) {
    errors.redirect_http_code = t('Select a valid redirect HTTP status code.');
  }
  const invalidPosition = positionError(values.position);
  if (invalidPosition) errors.position = invalidPosition;
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  // Build with the shared canonical builder so the wizard and this form agree.
  return buildL7PolicyPayload(values);
};
