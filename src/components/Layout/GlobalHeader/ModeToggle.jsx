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

import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Radio } from 'antd';
import {
  MODE_BASIC,
  MODE_ADVANCED,
  getHomePathForMode,
} from 'utils/console-mode';
import styles from './index.less';

export class ModeToggle extends Component {
  handleChange = (e) => {
    const nextMode = e.target.value;
    const { rootStore } = this.props;
    if (rootStore.consoleMode === nextMode) {
      return;
    }
    rootStore.setConsoleMode(nextMode);
    rootStore.routing.push(getHomePathForMode(nextMode));
  };

  render() {
    const currentMode = this.props.rootStore.consoleMode || MODE_ADVANCED;
    return (
      <Radio.Group
        value={currentMode}
        onChange={this.handleChange}
        size="small"
        buttonStyle="solid"
        className={styles['mode-toggle']}
        aria-label={t('Switch between Basic and Advanced console')}
      >
        <Radio.Button value={MODE_BASIC}>{t('Basic')}</Radio.Button>
        <Radio.Button value={MODE_ADVANCED}>{t('Advanced')}</Radio.Button>
      </Radio.Group>
    );
  }
}

export default inject('rootStore')(observer(ModeToggle));
