import { ConfirmAction } from 'containers/Action';
import globalJobStore from 'stores/qonos/job';
import { buildRunNowBody } from 'resources/qonos';

export default class RunNow extends ConfirmAction {
  get id() {
    return 'run-qonos-schedule-now';
  }

  get title() {
    return t('Run Now');
  }

  get buttonText() {
    return t('Run Now');
  }

  get actionName() {
    return t('Run Now');
  }

  policy = '';

  aliasPolicy = 'qonos:jobs:create';

  allowedCheckFunc = (item) => !!item.enabled;

  onSubmit = (item) => globalJobStore.create(buildRunNowBody(item));
}
