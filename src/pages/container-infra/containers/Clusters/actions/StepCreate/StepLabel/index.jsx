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
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Base from 'components/Form';
import { inject, observer } from 'mobx-react';
import KeyValueInput from 'components/FormItem/KeyValueInput';
import {
  presetLabels,
  MIN_NODE_COUNT_KEY,
  MIN_NODE_COUNT_VALUE,
  MAX_NODE_COUNT_KEY,
} from 'resources/magnum/cluster';

export class StepLabel extends Base {
  init() {
    const initLabels = this.getInitLabels();
    // Track the latest label list without forcing a re-render (typing in the
    // rows should not reset the add-select), and seed the state that drives it.
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

  get autoScalingEnabled() {
    const { context: { auto_scaling_enabled: autoScaling } = {} } = this.props;
    return !!autoScaling;
  }

  getBaseLabels() {
    const { context: { additionalLabels, clusterTemplate = {} } = {} } =
      this.props;
    // Preserve labels the user has already entered (kept in context across
    // step navigation); otherwise seed from the selected cluster template.
    if (additionalLabels && additionalLabels.length) {
      return additionalLabels.map((it) => ({ value: { ...it.value } }));
    }
    const { selectedRows = [] } = clusterTemplate;
    const { labels = {} } = selectedRows[0] || {};
    return Object.keys(labels || {}).map((key) => ({
      value: { key, value: `${labels[key]}` },
    }));
  }

  getInitLabels() {
    const labels = this.getBaseLabels();
    if (!this.autoScalingEnabled) {
      return labels;
    }
    // When auto scaling is enabled, min_node_count is required. Keep it as the
    // first item so it is non-removable (minCount) and read-only (readonlyKeys).
    const existing = labels.find((it) => it?.value?.key === MIN_NODE_COUNT_KEY);
    const rest = labels.filter((it) => it?.value?.key !== MIN_NODE_COUNT_KEY);
    const value = existing?.value?.value || MIN_NODE_COUNT_VALUE;
    return [{ value: { key: MIN_NODE_COUNT_KEY, value } }, ...rest];
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
    // Don't add a duplicate key; labels are a map.
    if (current.some((it) => it?.value?.key === preset.key)) {
      return;
    }
    const next = [
      ...current,
      { value: { key: preset.key, value: `${preset.value}` } },
    ];
    this.labelsValue = next;
    // setState drives the add-select to re-render with the new list, and we
    // sync the form value + wizard context so submit/validation see it.
    this.setState({ labelItems: next });
    this.updateFormValue('additionalLabels', next);
    this.updateContext({ additionalLabels: next });
  };

  getLabelNumber = (list, key) => {
    const item = (list || []).find((it) => it?.value?.key === key);
    const raw = item?.value?.value;
    if (raw === undefined || raw === '') {
      return undefined;
    }
    return Number(raw);
  };

  labelValidator = (rule, value) => {
    const list = value || [];
    const { context: { node_count: nodeCountRaw } = {} } = this.props;
    const nodes =
      nodeCountRaw === undefined || nodeCountRaw === ''
        ? undefined
        : Number(nodeCountRaw);
    const min = this.getLabelNumber(list, MIN_NODE_COUNT_KEY);
    const max = this.getLabelNumber(list, MAX_NODE_COUNT_KEY);

    if (min !== undefined) {
      if (!Number.isInteger(min) || min < 2) {
        return Promise.reject(
          t('"min_node_count" must be an integer greater than or equal to 2.')
        );
      }
      if (nodes !== undefined && min > nodes) {
        return Promise.reject(
          t(
            '"min_node_count" ({min}) cannot be greater than the number of nodes ({nodes}).',
            { min, nodes }
          )
        );
      }
    }

    if (max !== undefined) {
      if (!Number.isInteger(max) || max < 2) {
        return Promise.reject(
          t('"max_node_count" must be an integer greater than or equal to 2.')
        );
      }
      if (min !== undefined && max < min) {
        return Promise.reject(
          t(
            '"max_node_count" ({max}) cannot be less than "min_node_count" ({min}).',
            { max, min }
          )
        );
      }
      if (nodes !== undefined && max < nodes) {
        return Promise.reject(
          t(
            '"max_node_count" ({max}) cannot be less than the number of nodes ({nodes}).',
            { max, nodes }
          )
        );
      }
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
        minCount: this.autoScalingEnabled ? 1 : 0,
        readonlyKeys: this.autoScalingEnabled ? [MIN_NODE_COUNT_KEY] : [],
        integerValueKeys: [MIN_NODE_COUNT_KEY, MAX_NODE_COUNT_KEY],
        integerValueMin: 2,
        tips: this.autoScalingEnabled
          ? t(
              'Auto scaling is enabled, so the "min_node_count" label is required and must be at least 2.'
            )
          : undefined,
        validator: this.labelValidator,
        onChange: this.onLabelsChange,
      },
    ];
  }
}

export default inject('rootStore')(observer(StepLabel));
