import { ConfirmAction } from 'containers/Action';
import globalLeaseStore from 'stores/blazar/lease';

export default class DeleteAction extends ConfirmAction {
  get id() {
    return 'delete-lease';
  }

  get title() {
    return t('Delete Lease');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Lease');
  }

  policy = 'osreservations:leases:delete';

  onSubmit = (data) => {
    const { id } = data;
    return globalLeaseStore.delete({ id });
  };
}
