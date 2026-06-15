import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import { ACTION_TYPES, actionTypeOptions } from 'resources/qonos';

export class BaseStep extends Base {
  get name() {
    return t('Schedule base config');
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  get defaultValue() {
    return {
      action_type: ACTION_TYPES.SERVER_SNAPSHOT,
      enabled: true,
    };
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        placeholder: t('Please input name'),
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        rows: 3,
      },
      {
        name: 'enabled',
        label: t('Enabled'),
        type: 'switch',
      },
      {
        name: 'action_type',
        label: t('Action Type'),
        type: 'select',
        options: actionTypeOptions,
        disabled: true,
        required: true,
      },
    ];
  }
}

export default inject('rootStore')(observer(BaseStep));
