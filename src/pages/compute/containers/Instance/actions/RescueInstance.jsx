import React from 'react';
import { ConfirmAction } from 'src/containers/Action';
import globalServerStore from 'src/stores/nova/instance';
import globalImageStore from 'src/stores/glance/image';
import {
  isNotLockedOrAdmin,
  checkStatus,
  hasRootVolume,
} from 'resources/nova/instance';
import { isArray } from 'lodash';
import { Form, Input, Select } from 'antd';

export default class RescueInstanceAction extends ConfirmAction {
  constructor(props) {
    super(props);
    this.init();
  }

  init() {
    this.imageStore = globalImageStore;
    this.getImages();
  }

  getImages() {
    this.imageStore.fetchList({ all_projects: this.hasAdminRole });
  }

  get id() {
    return 'rescue';
  }

  get title() {
    return t('Rescue Instance');
  }

  get buttonText() {
    return t('Rescue');
  }

  get isAsyncAction() {
    return true;
  }

  policy = 'os_compute_api:os-rescue';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }

    if (hasRootVolume(item)) {
      return false;
    }
    // Allow rescue if instance is active or shutoff and not locked
    return (
      isNotLockedOrAdmin(item, this.isAdminPage) &&
      checkStatus(['active', 'shutoff', 'error'], item)
    );
  };

  performErrorMsg = (failedItems) => {
    const items = isArray(failedItems) ? failedItems : [failedItems];
    const statusErrorItems = items.filter((it) => !this.canReboot(it));
    const lockedItems = items.filter(
      (it) => !isNotLockedOrAdmin(it, this.isAdminPage)
    );
    const msgs = [];
    if (statusErrorItems.length) {
      msgs.push(
        t(
          'Instance "{ name }" status is not in active or shutoff, can not rescue it.',
          { name: this.getName(statusErrorItems) }
        )
      );
    }
    if (lockedItems.length) {
      msgs.push(
        t('Instance "{ name }" is locked, can not rescue it.', {
          name: this.getName(lockedItems),
        })
      );
    }
    return msgs.map((it) => <p>{it}</p>);
  };

  confirmContext = (data) => {
    const name = this.getName(data);
    const images = this.imageStore?.list?.data || [];

    return (
      <div>
        <p>{t('Are you sure to rescue instance: {name}?', { name })}</p>
        <Form
          layout="vertical"
          ref={(form) => {
            this.form = form;
          }}
        >
          <Form.Item
            label={t('Admin Password (Optional)')}
            name="adminPass"
            extra={t('Leave empty to generate a random password')}
          >
            <Input.Password placeholder={t('Enter admin password')} />
          </Form.Item>
          <Form.Item
            label={t('Rescue Image (Optional)')}
            name="rescue_image_ref"
            extra={t('Leave empty to use base image')}
          >
            <Select
              placeholder={t('Select rescue image')}
              allowClear
              showSearch
              optionFilterProp="children"
              loading={this.imageStore?.list?.isLoading}
            >
              {images.map((image) => (
                <Select.Option key={image.id} value={image.id}>
                  {image.name} ({image.id})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </div>
    );
  };

  onSubmit = async (item) => {
    const { id } = item || this.item;

    // Get form values
    const formValues = this.form ? await this.form.validateFields() : {};
    const { adminPass, rescue_image_ref } = formValues;

    const body = {
      rescue: {},
    };

    // Add adminPass if provided
    if (adminPass && adminPass.trim()) {
      body.rescue.adminPass = adminPass.trim();
    }

    // Add rescue_image_ref if provided
    if (rescue_image_ref) {
      body.rescue.rescue_image_ref = rescue_image_ref;
    }

    const response = await globalServerStore.rescue({ id, body });

    // Store the admin password for use in success message
    if (response && response.adminPass) {
      this.adminPass = response.adminPass;
    }

    return response;
  };

  submitSuccessMsg = (data) => {
    const name = this.getName(data);
    let baseMessage;

    if (this.isAsyncAction) {
      if (!this.messageHasItemName) {
        baseMessage = t(
          'The {action} instruction has been issued. \n You can wait for a few seconds to follow the changes of the list data or manually refresh the data to get the final display result.',
          { action: this.actionNameDisplay || this.title }
        );
      } else {
        baseMessage = t(
          'The {action} instruction has been issued, instance: {name}. \n You can wait for a few seconds to follow the changes of the list data or manually refresh the data to get the final display result.',
          { action: this.actionNameDisplay || this.title, name }
        );
      }
    } else if (!this.messageHasItemName) {
      baseMessage = t('{action} successfully.', {
        action: this.actionNameDisplay || this.title,
      });
    } else {
      baseMessage = t('{action} successfully, instance: {name}.', {
        action: this.actionNameDisplay || this.title,
        name,
      });
    }

    if (this.adminPass) {
      return `${baseMessage} ${t(
        '\n Please copy this admin password for temporary use till VM is in rescue mode: {adminPass}',
        {
          adminPass: this.adminPass,
        }
      )}`;
    }

    return baseMessage;
  };
}
