import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import globalSecurityGroupStore from 'stores/neutron/security-group';
import 'pages/basic/containers/basic-form.less';

// Basic-mode security group create. All inputs from the Advanced form
// (Name and Description) are kept. No table pickers here so nothing
// to swap.
export class BasicSecurityGroupCreate extends FormAction {
  static id = 'basic-security-group-create';

  static title = t('Create Security Group');

  static path = '/basic/network/security-group/create';

  static policy = 'create_security_group';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalSecurityGroupStore;
  }

  get name() {
    return t('Create security group');
  }

  get className() {
    return 'basic-create-form';
  }

  get listUrl() {
    return '/basic/network/security-group';
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        placeholder: t('Please input name'),
        required: true,
        withoutChinese: true,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
    ];
  }

  onSubmit = (values) => {
    // Notification is handled by BaseForm.onOk (success + error).
    return this.store.create(values);
  };
}

export default inject('rootStore')(observer(BasicSecurityGroupCreate));
