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

import { buildL7RulePayload, validateL7Rule } from 'resources/octavia/l7policy';
import { canChangePolicy } from '../../helpers';

export const canChangeRules = (policy = {}, deleting = false) =>
  !!policy.id &&
  !!policy.listener &&
  canChangePolicy(policy, policy.listener, deleting);

export const canChangeRule = (rule = {}, policy = {}, deleting = false) =>
  canChangeRules(policy, deleting) &&
  rule.l7policy_id === policy.id &&
  (deleting ? ['ACTIVE', 'ERROR'] : ['ACTIVE']).includes(
    rule.provisioning_status
  );

export const rulePayload = (values, editing = false) => {
  const result = buildL7RulePayload(values, { editing });
  const errors = validateL7Rule(result);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return result;
};
