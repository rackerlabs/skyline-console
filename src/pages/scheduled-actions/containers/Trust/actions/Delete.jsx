import { ConfirmAction } from 'containers/Action';
import globalTrustStore from 'stores/keystone/trust';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete-qonos-trust';
  }

  get title() {
    return t('Delete Trust');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Trust');
  }

  get isDanger() {
    return true;
  }

  policy = '';

  aliasPolicy = 'keystone:identity:delete_trust';

  allowedCheckFunc = () => this.containerProps.rootStore.hasAdminRole;

  onSubmit = (item) => globalTrustStore.delete({ id: item.id });
}
