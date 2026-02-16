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

import Base from 'components/Form';
import { inject, observer } from 'mobx-react';

export class StepInfo extends Base {
  get title() {
    return t('Info');
  }

  get name() {
    return t('Info');
  }

  get isEdit() {
    return !!this.props.extra;
  }

  get isStep() {
    return true;
  }

  get defaultValue() {
    let values = {
      coe: 'kubernetes',
    };

    if (this.isEdit) {
      const {
        extra: {
          name,
          coe,
          public: publics,
          registry_enabled,
          tls_disabled,
        } = {},
      } = this.props;
      values = {
        name,
        coe,
        public: publics,
        registry_enabled,
        tls_disabled,
      };
    }
    return values;
  }

  nameValidator = (rule, value) => {
    const pattern = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;
    if (!value) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('');
    }
    if (!pattern.test(value)) {
      return Promise.reject(
        t(
          'The name should start with upper letter or lower letter, characters can only contain "0-9, a-z, A-Z, -, _, ."'
        )
      );
    }
    return Promise.resolve();
  };

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Template Name'),
        type: 'input',
        placeholder: t('Please input cluster template name'),
        required: true,
        validator: this.nameValidator,
      },
      {
        name: 'coeDisplay',
        label: t('COE'),
        type: 'label',
        content: t('Kubernetes'),
        style: { marginBottom: 22 },
      },
      {
        name: 'coe',
        type: 'input',
        hidden: true,
      },
      {
        name: 'public',
        label: t('Public'),
        type: 'switch',
      },
    ];
  }
}

export default inject('rootStore')(observer(StepInfo));
