import { inject, observer } from 'mobx-react';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';
import { buildExecutionProfileBody } from 'resources/qonos';
import { Create } from './Create';

export class Edit extends Create {
  static id = 'edit-qonos-execution-profile';

  static title = t('Edit Execution Profile');

  static buttonText = t('Edit');

  static aliasPolicy = 'qonos:execution_profiles:update';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalExecutionProfileStore;
  }

  get name() {
    return t('Edit execution profile');
  }

  get defaultValue() {
    return {
      ...this.item,
      auth_type: 'trust',
    };
  }

  get trustIdFormItem() {
    return {
      name: 'trust_id',
      label: t('Trust ID'),
      type: 'input',
      disabled: true,
      required: true,
      tip: t(
        'Trust ID cannot be changed after the execution profile is created.'
      ),
    };
  }

  onSubmit = (values) =>
    this.store.edit(
      { id: this.item.id },
      buildExecutionProfileBody({
        ...values,
        trust_id: this.item.trust_id,
      })
    );
}

export default inject('rootStore')(observer(Edit));
