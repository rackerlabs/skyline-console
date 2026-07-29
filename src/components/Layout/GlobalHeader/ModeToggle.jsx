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
    const { rootStore } = this.props;
    // Basic is a project-user experience. Admins always work in the
    // full Advanced console, so hide the toggle for anyone with an
    // admin role.
    if (rootStore.hasAdminPageRole) {
      return null;
    }
    const currentMode = rootStore.consoleMode || MODE_ADVANCED;
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
