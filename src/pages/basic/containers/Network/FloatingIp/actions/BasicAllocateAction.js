import { FormAction } from 'containers/Action';

// Link-style primary action pointing at the Basic single-page allocate
// form.
export default class BasicAllocateAction extends FormAction {
  static id = 'basic-fip-allocate';

  static title = t('Allocate IP');

  static actionType = 'link';

  static path = '/basic/network/floatingip/create';

  static policy = 'create_floatingip';

  static allowed = () => Promise.resolve(true);
}
