import { ConfirmAction } from 'containers/Action';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';

export default class ToggleEnabled extends ConfirmAction {
  get id() {
    return 'toggle-qonos-execution-profile';
  }

  get title() {
    return this.item.enabled
      ? t('Disable Execution Profile')
      : t('Enable Execution Profile');
  }

  get buttonText() {
    return this.title;
  }

  get actionName() {
    return this.title;
  }

  policy = '';

  aliasPolicy = 'qonos:execution_profiles:update';

  onSubmit = (item) =>
    globalExecutionProfileStore.toggleEnabled(item, !item.enabled);
}
