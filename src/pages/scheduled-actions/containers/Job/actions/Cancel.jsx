import { ConfirmAction } from 'containers/Action';
import globalJobStore from 'stores/qonos/job';
import { executableJobStatuses } from 'resources/qonos';

export default class Cancel extends ConfirmAction {
  get id() {
    return 'cancel-qonos-job';
  }

  get title() {
    return t('Cancel Job');
  }

  get buttonText() {
    return t('Cancel');
  }

  get actionName() {
    return t('Cancel Job');
  }

  get isDanger() {
    return true;
  }

  policy = '';

  aliasPolicy = 'qonos:jobs:cancel';

  get hasAdminOrServiceRole() {
    const globalRootStore = require('stores/root').default;
    const roles = globalRootStore.roles || [];
    return (
      this.isAdminPage ||
      globalRootStore.hasAdminRole ||
      roles.some((role) => role.name === 'admin' || role.name === 'service')
    );
  }

  allowedCheckFunc = (item) =>
    this.hasAdminOrServiceRole && executableJobStatuses.includes(item?.status);

  onSubmit = (item) => globalJobStore.cancel({ id: item.id });
}
