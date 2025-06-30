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
        <div>
          {t('Are you sure you want to rescue instance: {name}', { name })}
        </div>
        <div style={{ marginTop: 4 }}>
          {t(
            'Rescue Mode is for debugging, data recovery, and emergency access. The server will go offline and its file system will be mounted to a temporary server.'
          )}
        </div>
        <div style={{ margin: '4px 0' }}>
          <strong>{t('Warning')}:</strong>{' '}
          {t(
            'While in Rescue Mode, only you have access to the server. All other traffic is suspended.'
          ).replace('Warning: ', '')}
        </div>
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
    if (this.adminPass) {
      return (
        <div>
          <div style={{ marginBottom: 4 }}>
            {t('Rescue Mode Activated for: ')}
            <strong>{this.getName(data)}</strong>
          </div>
          <div>
            {t(
              'The temporary server will take a few minutes to prepare. Refresh for status update.'
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>{t('Please copy this temporary password:')}</strong>
          </div>
          <div style={{ marginBottom: 4 }}>{this.adminPass}</div>
          <div>
            <strong>{t('Warning')}:</strong>{' '}
            {t(
              'Once notification is closed you will not be able to view this password again.'
            ).replace('Warning: ', '')}
          </div>
        </div>
      );
    }
    // Fallback if no password is present
    return (
      <div>
        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
          {t('Rescue Mode Activated')}
        </div>
        <div>
          {t('The temporary server will take a few minutes to prepare.')}
        </div>
      </div>
    );
  };
}
