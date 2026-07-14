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

  policy = '';

  aliasPolicy = 'qonos:jobs:cancel';

  allowedCheckFunc = (item) => executableJobStatuses.includes(item.status);

  onSubmit = (item) => globalJobStore.cancel({ id: item.id });
}
