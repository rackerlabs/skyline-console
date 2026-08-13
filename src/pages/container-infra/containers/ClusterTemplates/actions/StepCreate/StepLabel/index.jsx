// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unles //required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Base from 'components/Form';
import { inject, observer } from 'mobx-react';
import KeyValueInput from 'components/FormItem/KeyValueInput';
import { presetLabels } from 'resources/magnum/cluster';

export class StepLabel extends Base {
  init() {
    const initLabels = this.getInitLabels();
    this.labelsValue = initLabels;
    this.state = {
      ...this.state,
      labelItems: initLabels,
    };
  }

  get title() {
    return t('Labels');
  }

  get name() {
    return t('Labels');
  }

  get isStep() {
    return true;
  }

  get isEdit() {
    return !!this.props.extra;
  }

  getInitLabels() {
    const { context: { additionalLabels } = {} } = this.props;
    if (additionalLabels && additionalLabels.length) {
      return additionalLabels.map((it) => ({ value: { ...it.value } }));
    }
    if (this.isEdit) {
      const { extra: { labels } = {} } = this.props;
      return Object.keys(labels || {}).map((key) => ({
        value: { key, value: `${labels[key]}` },
      }));
    }
    return [];
  }

  get defaultValue() {
    return {
      additionalLabels: this.getInitLabels(),
    };
  }

  onLabelsChange = (value) => {
    this.labelsValue = value;
    this.updateContext({
      additionalLabels: value,
    });
  };

  addPresetLabel = (preset) => {
    const current = this.labelsValue || this.state.labelItems || [];
    if (current.some((it) => it?.value?.key === preset.key)) {
      return;
    }
    const next = [
      ...current,
      { value: { key: preset.key, value: `${preset.value}` } },
    ];
    this.labelsValue = next;
    this.setState({ labelItems: next });
    this.updateFormValue('additionalLabels', next);
    this.updateContext({ additionalLabels: next });
  };

  keyValidator = (rule, values) => {
    if (!values?.length) return Promise.resolve();
    const pattern = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;
    const invalidKey = values.find((item) => {
      const key = item?.value?.key;
      if (!key) {
        return false;
      }
      return !pattern.test(key);
    });
    if (invalidKey) {
      return Promise.reject(
        t(
          'The name should start with upper letter or lower letter, characters can only contain "0-9, a-z, A-Z, -, _, ."'
        )
      );
    }
    return Promise.resolve();
  };

  renderPresetLabels() {
    return (
      <Space size={[8, 8]} wrap>
        {presetLabels.map((p) => (
          <Button
            key={p.key}
            size="small"
            icon={<PlusOutlined />}
            onClick={() => this.addPresetLabel(p)}
          >
            {`${p.key}: ${p.value}`}
          </Button>
        ))}
      </Space>
    );
  }

  get formItems() {
    return [
      {
        name: 'presetLabels',
        label: t('Label Templates'),
        type: 'label',
        content: this.renderPresetLabels(),
      },
      {
        name: 'additionalLabels',
        label: t('Additional Labels'),
        type: 'add-select',
        itemComponent: KeyValueInput,
        addText: t('Add Label'),
        initValue: this.state.labelItems,
        validator: this.keyValidator,
        onChange: this.onLabelsChange,
      },
    ];
  }
}

export default inject('rootStore')(observer(StepLabel));
