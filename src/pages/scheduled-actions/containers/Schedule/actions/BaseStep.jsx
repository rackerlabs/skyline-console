import { inject, observer } from 'mobx-react';
import Base from 'components/Form';

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
    ];
  }
}

export default inject('rootStore')(observer(BaseStep));
