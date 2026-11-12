import React from 'react';
import { Alert } from 'antd';
import { has } from 'lodash';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalContainerStore from 'stores/swift/container';
import globalSwiftInfoStore from 'stores/swift/info';
import { allCanChangePolicy } from 'resources/skyline/policy';
import {
  getManageVersioningDisabledReason,
  getSwiftErrorBody,
  VERSIONING_ENABLED,
} from 'resources/swift/versioning';
import { getSwiftErrorFormItem } from './SwiftError';

const getContainerName = (item) => (item && (item.name || item.id)) || '';

export class ManageVersioning extends ModalAction {
  static id = 'manage-versioning';

  static title = t('Manage Versioning');

  static policy = allCanChangePolicy;

  // Swift errors are rendered verbatim inside the modal, which stays open.
  static keepModalOnSubmitError = true;

  static allowed = (_, containerProps) => {
    const { isAdminPage } = containerProps || {};
    return Promise.resolve(
      !isAdminPage && globalSwiftInfoStore.isVersioningSupported
    );
  };

  // Evaluated by the row action button when it renders (i.e. when the row
  // menu opens). Shares the cached HEAD with the Versioning column.
  static getDisabledReason = async (item) => {
    if (!globalSwiftInfoStore.isVersioningSupported) {
      return null;
    }
    const name = getContainerName(item);
    if (!name) {
      return null;
    }
    const info = await globalContainerStore.fetchVersioning(name);
    return getManageVersioningDisabledReason(info);
  };

  init() {
    this.state = {
      ...this.state,
      swiftError: null,
      currentState: null,
      enabledValue: false,
    };
    this.hasInlineError = false;
    this.fetchCurrent();
  }

  get name() {
    return t('Manage Versioning');
  }

  get containerName() {
    return getContainerName(this.item);
  }

  get showNotice() {
    return !this.hasInlineError;
  }

  get isCurrentlyEnabled() {
    return this.state.currentState === VERSIONING_ENABLED;
  }

  async fetchCurrent() {
    const info = await globalContainerStore.fetchVersioning(this.containerName);
    const currentState = (info && info.state) || null;
    this.setState(
      {
        currentState,
        enabledValue: currentState === VERSIONING_ENABLED,
      },
      () => {
        this.updateDefaultValue();
      }
    );
  }

  get defaultValue() {
    return {
      enabled: this.isCurrentlyEnabled,
    };
  }

  onValuesChange = (changedFields) => {
    if (has(changedFields, 'enabled')) {
      this.setState({ enabledValue: !!changedFields.enabled });
    }
  };

  get formItems() {
    const { swiftError, enabledValue } = this.state;
    const turningOff = this.isCurrentlyEnabled && !enabledValue;
    return [
      {
        name: 'enabled',
        label: t('Object Versioning'),
        type: 'switch',
        tip: t(
          'Keep previous versions of objects when they are overwritten or deleted. Stored versions count toward usage.'
        ),
      },
      {
        type: 'label',
        display: turningOff,
        wrapperCol: { xs: { span: 24 }, sm: { span: 22 } },
        component: (
          <Alert
            type="warning"
            showIcon
            message={t(
              'Turning versioning off suspends it. Existing versions are kept and still count toward usage.'
            )}
          />
        ),
      },
      getSwiftErrorFormItem(swiftError),
    ];
  }

  onSubmit = async (values) => {
    const enabled = !!(values && values.enabled);
    this.hasInlineError = false;
    this.setState({ swiftError: null });
    if (enabled === this.isCurrentlyEnabled) {
      // Nothing changed: don't turn a never-versioned container into a
      // suspended one by POSTing X-Versions-Enabled: false.
      return null;
    }
    try {
      return await globalContainerStore.updateVersioning(
        this.containerName,
        enabled
      );
    } catch (error) {
      this.hasInlineError = true;
      this.setState({ swiftError: getSwiftErrorBody(error) });
      throw error;
    }
  };
}

export default inject('rootStore')(observer(ManageVersioning));
