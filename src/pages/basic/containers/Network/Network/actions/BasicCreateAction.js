import { FormAction } from 'containers/Action';

// Link-style primary action: clicking "Create Network" on the list
// takes the user to the Basic single-page create form.
export default class BasicCreateAction extends FormAction {
  static id = 'basic-network-create';

  static title = t('Create Network');

  static actionType = 'link';

  static path = '/basic/network/network/create';

  static policy = ['create_network'];

  static allowed = () => Promise.resolve(true);
}
