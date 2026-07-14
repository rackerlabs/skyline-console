import { ConfirmAction } from 'containers/Action';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete-qonos-execution-profile';
  }

  get title() {
    return t('Delete Execution Profile');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Execution Profile');
  }

  get isDanger() {
    return true;
  }

  policy = '';

  aliasPolicy = 'qonos:execution_profiles:delete';

  onSubmit = (item) => globalExecutionProfileStore.delete({ id: item.id });
}
