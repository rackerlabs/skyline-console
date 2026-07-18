import { FormAction } from 'containers/Action';

// Link-style primary action pointing at the Basic single-page create.
export default class BasicCreateAction extends FormAction {
  static id = 'basic-security-group-create';

  static title = t('Create Security Group');

  static actionType = 'link';

  static path = '/basic/network/security-group/create';

  static policy = 'create_security_group';

  static allowed = () => Promise.resolve(true);
}
