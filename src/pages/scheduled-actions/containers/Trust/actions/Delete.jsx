import { isArray } from 'lodash';
import { ConfirmAction } from 'containers/Action';
import globalTrustStore from 'stores/keystone/trust';
import globalRootStore from 'stores/root';
import { trustHasEnabledExecutionProfile } from 'resources/qonos';

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

  policy = 'identity:delete_trust';

  aliasPolicy = '';

  get inUseMessage() {
    return t(
      'Cannot delete this trust because it is associated with an enabled execution profile.'
    );
  }

  allowedCheckFunc = (item) => {
    const userId = globalRootStore.user?.user?.id;
    return !!userId && item?.trustor_user_id === userId;
  };

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
      items.map((it) => trustHasEnabledExecutionProfile(it.id))
    );
    if (inUseFlags.some((inUse) => inUse)) {
      return Promise.reject(this.inUseMessage);
    }
    return Promise.resolve(true);
  };

  onSubmit = (item) => globalTrustStore.delete({ id: item.id });
}
