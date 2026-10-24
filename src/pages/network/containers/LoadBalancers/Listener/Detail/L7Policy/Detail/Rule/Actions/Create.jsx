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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import { L7RuleStore } from 'stores/octavia/l7rule';
import {
  l7RuleTypes,
  getL7RuleCompareTypes,
  isL7RuleKeyRequired,
  validateL7Rule,
} from 'resources/octavia/l7policy';
import { canChangeRules, canChangeRule, rulePayload } from '../helpers';

export class Create extends ModalAction {
  static id = 'l7rule-create';

  static title = t('Create L7 Rule');

  static buttonText = t('Create L7 Rule');

  static policy = 'os_load-balancer_api:l7rule:post';

  static allowed = (item, containerProps = {}) =>
    Promise.resolve(canChangeRules(containerProps.detail || item));

  get name() {
    return t('Create L7 Rule');
  }

  get isEdit() {
    return false;
  }

  get isAsyncAction() {
    return true;
  }

  get policyDetail() {
    return this.containerProps.detail || {};
  }

  get instanceName() {
    return this.isEdit ? this.item.id : this.values.type || t('L7 Rule');
  }

  init() {
    this.store = new L7RuleStore();
    this.state = { ...this.state, ruleType: this.defaultValue.type };
  }

  get defaultValue() {
    return {
      type: 'HOST_NAME',
      compare_type: 'EQUAL_TO',
      invert: false,
      admin_state_up: true,
    };
  }

  handleTypeChange = (type) => {
    const form = this.formRef.current;
    const currentCompare = form?.getFieldValue('compare_type');
    const comparisons = getL7RuleCompareTypes(type);
    form?.setFieldsValue({
      compare_type: comparisons.includes(currentCompare)
        ? currentCompare
        : 'EQUAL_TO',
      key: undefined,
      value: undefined,
    });
    this.setState({ ruleType: type });
  };

  validateField = (field, value) => {
    const values = this.formRef.current?.getFieldsValue(true) || {};
    // validateL7Rule owns the length/line-break check now.
    const error = validateL7Rule({
      ...values,
      type: this.state.ruleType,
      [field]: value,
    })[field];
    return error ? Promise.reject(new Error(error)) : Promise.resolve();
  };

  get formItems() {
    const { ruleType } = this.state;
    return [
      {
        name: 'type',
        label: t('Rule Type'),
        type: 'select',
        required: true,
        allowClear: false,
        options: l7RuleTypes.map((value) => ({ value, label: value })),
        onChange: this.handleTypeChange,
      },
      {
        name: 'compare_type',
        label: t('Compare Type'),
        type: 'select',
        required: true,
        allowClear: false,
        options: getL7RuleCompareTypes(ruleType).map((value) => ({
          value,
          label: value,
        })),
      },
      {
        name: 'key',
        label: t('Key'),
        type: 'input',
        required: true,
        maxLength: 255,
        hidden: !isL7RuleKeyRequired(ruleType),
        validator: (rule, value) => this.validateField('key', value),
      },
      {
        name: 'value',
        label: t('Value'),
        type: 'input',
        required: true,
        maxLength: 255,
        validator: (rule, value) => this.validateField('value', value),
      },
      { name: 'invert', label: t('Invert'), type: 'switch' },
      { name: 'admin_state_up', label: t('Admin State Up'), type: 'switch' },
    ];
  }

  onSubmit = async (values) => {
    const allowed = this.isEdit
      ? canChangeRule(this.item, this.policyDetail)
      : canChangeRules(this.policyDetail);
    if (!allowed)
      throw new Error(
        t(
          'The policy, listener and load balancer must be active before changing L7 rules.'
        )
      );
    const data = rulePayload(values, this.isEdit);
    const l7policy_id = this.policyDetail.id;
    return this.isEdit
      ? this.store.update({ id: this.item.id, l7policy_id }, data)
      : this.store.create({ ...data, l7policy_id });
  };
}
export default inject('rootStore')(observer(Create));
