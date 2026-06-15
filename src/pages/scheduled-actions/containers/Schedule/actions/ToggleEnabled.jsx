import { ConfirmAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';

export default class ToggleEnabled extends ConfirmAction {
  get id() {
    return 'toggle-qonos-schedule';
  }

  get title() {
    return this.item.enabled ? t('Disable Schedule') : t('Enable Schedule');
  }

  get buttonText() {
    return this.title;
  }

  get actionName() {
    return this.title;
  }

  policy = '';

  aliasPolicy = 'qonos:schedules:update';

  onSubmit = (item) => globalScheduleStore.toggleEnabled(item, !item.enabled);
}
