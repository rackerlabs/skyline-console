import { ConfirmAction } from 'containers/Action';
import globalFreezerClientStore from 'stores/freezer/client';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Client');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Client');
  }

  get isDanger() {
    return true;
  }

  policy = 'freezer:client:delete';

  onSubmit = (item) => globalFreezerClientStore.delete({ id: item.id });
}
