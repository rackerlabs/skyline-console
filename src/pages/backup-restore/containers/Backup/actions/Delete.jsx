import { ConfirmAction } from 'containers/Action';
import globalFreezerBackupStore from 'stores/freezer/backup';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Backup');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Backup');
  }

  get isDanger() {
    return true;
  }

  policy = 'freezer:backup:delete';

  onSubmit = (item) => globalFreezerBackupStore.delete({ id: item.id });
}
