import { ConfirmAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete-qonos-schedule';
  }

  get title() {
    return t('Delete Schedule');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Schedule');
  }

  get isDanger() {
    return true;
  }

  policy = '';

  aliasPolicy = 'qonos:schedules:delete';

  onSubmit = (item) => globalScheduleStore.delete({ id: item.id });
}
