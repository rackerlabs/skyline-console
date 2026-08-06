import { isArray } from 'lodash';
import { ConfirmAction } from 'containers/Action';
import globalExecutionProfileStore from 'stores/qonos/execution-profile';
import { executionProfileHasEnabledSchedule } from 'resources/qonos';

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

  get inUseMessage() {
    return t(
      'Cannot delete this execution profile because it is referenced by an enabled schedule.'
    );
  }

  perform = async (data) => {
    const allowedResult = await this.allowed(data);
    const items = isArray(data) ? data : [data];
    if (isArray(data)) {
      if (!allowedResult.every((value) => !!value)) {
        const failedItems = [];
        allowedResult.forEach((value, index) => {
          if (!value) {
            failedItems.push(items[index]);
          }
        });
        return Promise.reject(
          this.unescape(this.performErrorMsg(failedItems, true))
        );
      }
    } else if (!allowedResult) {
      return Promise.reject(this.performErrorMsg(data));
    }
    const inUseFlags = await Promise.all(
      items.map((it) => executionProfileHasEnabledSchedule(it.id))
    );
    if (inUseFlags.some((inUse) => inUse)) {
      return Promise.reject(this.inUseMessage);
    }
    return Promise.resolve(true);
  };

  onSubmit = (item) => globalExecutionProfileStore.delete({ id: item.id });
}
