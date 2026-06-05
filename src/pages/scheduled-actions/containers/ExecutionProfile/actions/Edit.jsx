import { inject, observer } from 'mobx-react';
import { buildExecutionProfileBody } from 'resources/qonos';
import Create from './Create';

export class Edit extends Create {
  static id = 'edit-qonos-execution-profile';

  static title = t('Edit Execution Profile');

  static buttonText = t('Edit');

  static aliasPolicy = 'qonos:execution_profiles:update';

  get name() {
    return t('Edit execution profile');
  }

  get defaultValue() {
    return {
      ...this.item,
      auth_type: 'trust',
    };
  }

  onSubmit = (values) =>
    this.store.edit({ id: this.item.id }, buildExecutionProfileBody(values));
}

export default inject('rootStore')(observer(Edit));
