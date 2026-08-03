import { ConfirmAction } from 'containers/Action';
import globalContainerStore from 'stores/swift/container';
import { allCanChangePolicy } from 'resources/skyline/policy';

export default class CDN extends ConfirmAction {
  get id() {
    return 'cdn';
  }

  // Use the authoritative cdn_enabled state to decide the label.
  get isEnabled() {
    return !!(this.item && this.item.cdn_enabled);
  }

  get title() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get name() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get buttonText() {
    return this.isEnabled ? t('Disable CDN') : t('Enable CDN');
  }

  get actionName() {
    return this.isEnabled ? t('disable CDN') : t('enable CDN');
  }

  policy = allCanChangePolicy;

  allowed = () => Promise.resolve(!this.isAdminPage);

  onSubmit = () => {
    const { name, id } = this.item;
    return globalContainerStore.updateCDN(name || id, !this.isEnabled);
  };

  submitErrorMsg(data, realError) {
    if (
      realError?.response?.data?.detail &&
      typeof realError.response.data.detail === 'string'
    ) {
      return realError.response.data.detail;
    }
    if (
      realError?.response?.data &&
      typeof realError.response.data === 'string'
    ) {
      return realError.response.data;
    }
    if (realError?.message && typeof realError.message === 'string') {
      return realError.message;
    }
    return super.submitErrorMsg(data, realError);
  }
}
