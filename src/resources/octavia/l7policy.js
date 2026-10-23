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

// Actions supported by the planned forms. REDIRECT_PREFIX is outside this scope.
export const l7PolicyActions = Object.freeze([
  'REJECT',
  'REDIRECT_TO_URL',
  'REDIRECT_TO_POOL',
]);

export const l7RuleTypes = Object.freeze([
  'HOST_NAME',
  'PATH',
  'FILE_TYPE',
  'HEADER',
  'COOKIE',
]);

export const l7CompareTypes = Object.freeze([
  'EQUAL_TO',
  'CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
  'REGEX',
]);

export const ruleTypesRequiringKey = Object.freeze(['HEADER', 'COOKIE']);

export const l7PolicyRedirectFields = Object.freeze({
  REDIRECT_TO_URL: 'redirect_url',
  REDIRECT_TO_POOL: 'redirect_pool_id',
});

// Allowed HTTP status codes for a REDIRECT_TO_URL policy (single source).
export const l7PolicyRedirectHttpCodes = Object.freeze([
  301, 302, 303, 307, 308,
]);

// Friendly labels for the policy actions, shared by the wizard and the pages.
export const actionLabels = Object.freeze({
  REJECT: t('Reject'),
  REDIRECT_TO_URL: t('Redirect to URL'),
  REDIRECT_TO_POOL: t('Redirect to Pool'),
});

// Keep comparison restrictions aligned with octavia/common/validate.py.
export const getL7RuleCompareTypes = (type) => {
  if (!l7RuleTypes.includes(type)) {
    return [];
  }
  if (type === 'FILE_TYPE') {
    return ['EQUAL_TO', 'REGEX'];
  }
  return [...l7CompareTypes];
};

export const isL7RuleKeyRequired = (type) =>
  ruleTypesRequiringKey.includes(type);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const headerNamePattern = /^[a-zA-Z0-9!#$%&'*+.^_`|~-]+$/;
const exceedsLength = (value) =>
  typeof value === 'string' && (value.length > 255 || /[\r\n]/.test(value));

/**
 * Validate a complete rule using API field names (compare_type, not compareType).
 * Return field-to-message errors without changing the input. Callers must merge
 * partial edits with the existing rule first. Octavia remains authoritative for
 * regex syntax, ordinary value syntax, and listener/provider compatibility.
 */
export const validateL7Rule = (rule = {}) => {
  const { type, compare_type: compareType, key, value } = rule;
  const errors = {};
  if (!l7RuleTypes.includes(type)) {
    errors.type = t('Select a valid L7 rule type.');
  }
  if (!getL7RuleCompareTypes(type).includes(compareType)) {
    errors.compare_type = t('Select a valid comparison for this rule type.');
  }
  if (typeof value !== 'string' || value.length === 0) {
    errors.value = t('A rule value is required and must be a string.');
  } else if (exceedsLength(value)) {
    errors.value = t('Enter at most 255 characters without line breaks.');
  }
  if (isL7RuleKeyRequired(type)) {
    if (!hasText(key) || /\s/.test(key) || !headerNamePattern.test(key)) {
      errors.key = t('Enter a valid key for this rule type.');
    } else if (exceedsLength(key)) {
      errors.key = t('Enter at most 255 characters without line breaks.');
    }
  }
  return errors;
};

/**
 * Validate the action and required redirect target of a complete policy form.
 * Pool ownership/compatibility and optional fields are checked by the caller
 * and Octavia. This helper does not build or sanitize the request body.
 */
export const validateL7Policy = (policy = {}) => {
  const {
    action,
    redirect_url: redirectUrl,
    redirect_pool_id: redirectPoolId,
  } = policy;
  const errors = {};
  if (!l7PolicyActions.includes(action)) {
    errors.action = t('Select a valid L7 policy action.');
  }
  if (action === 'REDIRECT_TO_POOL' && !hasText(redirectPoolId)) {
    errors.redirect_pool_id = t('Select a redirect pool.');
  }
  if (action === 'REDIRECT_TO_URL') {
    try {
      const url = new URL(redirectUrl);
      if (
        !hasText(redirectUrl) ||
        !/^https?:\/\//i.test(redirectUrl) ||
        /[\s\u0000-\u001f\u007f-\u009f\\]/.test(redirectUrl) || // eslint-disable-line no-control-regex
        !['http:', 'https:'].includes(url.protocol) ||
        !url.hostname
      ) {
        errors.redirect_url = t('Enter a valid HTTP or HTTPS redirect URL.');
      }
    } catch (error) {
      errors.redirect_url = t('Enter a valid HTTP or HTTPS redirect URL.');
    }
  }
  return errors;
};

/**
 * Canonical L7 rule request body, built from API field names (compare_type).
 * Single source of truth for both the create-time wizard and the post-creation
 * form, so the same inputs always produce the same body. Does not validate.
 * `editing` clears a stale key when switching to a keyless type on PUT.
 */
export const buildL7RulePayload = (rule = {}, { editing = false } = {}) => {
  const {
    type,
    compare_type: compareType,
    value,
    invert = false,
    admin_state_up: adminStateUp = true,
  } = rule;
  const result = {
    type,
    compare_type: compareType,
    value,
    invert: !!invert,
    admin_state_up: adminStateUp !== false,
  };
  if (isL7RuleKeyRequired(type)) result.key = rule.key;
  else if (editing) result.key = null;
  return result;
};

/**
 * Canonical L7 policy request body, built from API field names. Shared by the
 * create-time wizard and the post-creation form. Emits only the redirect target
 * for the chosen action (via l7PolicyRedirectFields) and omits a blank position.
 * Does not validate and does not attach rules (callers nest those when needed).
 */
export const buildL7PolicyPayload = (policy = {}) => {
  const {
    name = '',
    description = '',
    action,
    admin_state_up: adminStateUp = true,
    position,
    redirect_http_code: redirectHttpCode,
  } = policy;
  const result = {
    name,
    description,
    action,
    admin_state_up: adminStateUp !== false,
  };
  if (position !== undefined && position !== null && position !== '') {
    result.position = position;
  }
  const redirectField = l7PolicyRedirectFields[action];
  if (redirectField) result[redirectField] = policy[redirectField];
  if (action === 'REDIRECT_TO_URL' && redirectHttpCode !== undefined) {
    result.redirect_http_code = redirectHttpCode;
  }
  return result;
};
