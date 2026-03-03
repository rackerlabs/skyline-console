// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { ConfirmAction } from 'containers/Action';
import { isArray } from 'lodash';
import globalImageStore from 'stores/glance/image';
import { isOwner } from 'resources/glance/image';

export default class DeleteAction extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Image');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete image');
  }

  policy = 'delete_image';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return (
      this.notDeleted(item) &&
      this.notProtected(item) &&
      (isOwner(item) || this.isAdminPage)
    );
  };

  notDeleted(image) {
    return image.status !== 'deleted';
  }

  notProtected(image) {
    return !image.protected;
  }

  renderBoldList = (items) =>
    items.map((item, index) => (
      <React.Fragment key={this.getItemId(item) || index}>
        {index > 0 ? ', ' : ''}
        <strong>{this.getItemName(item)}</strong>
      </React.Fragment>
    ));

  renderTemplateWithName = (template, token, nameNode) => {
    if (!template.includes(token)) {
      return template;
    }
    const [before, after] = template.split(token);
    return (
      <span>
        {before}
        {nameNode}
        {after}
      </span>
    );
  };

  performErrorMsg = (failedItems, isBatch) => {
    const items = isArray(failedItems) ? failedItems : [failedItems];
    const protectedItems = items.filter((it) => it?.protected);
    if (protectedItems.length > 0) {
      if (isBatch || protectedItems.length > 1) {
        const template = t(
          'The following images are protected: {names}. Only support can remove protection, and they cannot be deleted until protection is disabled.',
          { names: '__IMAGE_NAMES__' }
        );
        return this.renderTemplateWithName(
          template,
          '__IMAGE_NAMES__',
          this.renderBoldList(protectedItems)
        );
      }
      const name = this.getItemName(protectedItems[0]);
      const template = t(
        'Image "{name}" is protected. Only support can remove protection, and it cannot be deleted until protection is disabled.',
        { name: '__IMAGE_NAME__' }
      );
      return this.renderTemplateWithName(
        template,
        '__IMAGE_NAME__',
        <strong>{name}</strong>
      );
    }
    if (isBatch) {
      if (!this.messageHasItemName) {
        return '';
      }
      const name = this.getName(failedItems);
      return t('instance: {name}.', { name });
    }
    if (!this.messageHasItemName) {
      return t('You are not allowed to {action}.', {
        action: this.actionNameDisplay || this.title,
      });
    }
    const name = this.getName(failedItems);
    return t('You are not allowed to {action}, instance: {name}.', {
      action: this.actionNameDisplay || this.title,
      name,
    });
  };

  onSubmit = (data) => globalImageStore.delete({ id: data.id });
}
