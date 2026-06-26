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
import { inject, observer } from 'mobx-react';
import { Spin, Tooltip } from 'antd';
import { AppstoreOutlined, SwapOutlined } from '@ant-design/icons';
import ItemActionButtons from 'components/Tables/Base/ItemActionButtons';
import globalUserStore from 'stores/keystone/user';
import globalTagStore from 'stores/keystone/tag';
import styles from './index.less';
import ProjectSelect from './ProjectTable';

export class ProjectDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectTags: [],
      showTooltip: false,
    };
  }

  componentDidMount() {
    this.loadProjectTags();
  }

  componentDidUpdate(prevProps) {
    const prevProjectId = prevProps.rootStore?.user?.project?.id;
    const projectId = this.props.rootStore?.user?.project?.id;
    if (projectId && projectId !== prevProjectId) {
      this.loadProjectTags();
    }
  }

  get user() {
    const { user } = this.props.rootStore;
    return user;
  }

  get project() {
    const {
      project: {
        id: projectId = '',
        name: projectName = '',
        domain: { name: userDomainName } = {},
      } = {},
    } = this.user || {};
    return {
      projectId,
      projectName,
      userDomainName,
    };
  }

  hideTooltip = () => {
    this.setState({ showTooltip: false });
  };

  normalizeTags = (tags = []) => {
    if (!Array.isArray(tags)) {
      return [];
    }
    return tags
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        return (item.name || item.value || '').trim();
      })
      .filter(Boolean);
  };

  loadProjectTags = async () => {
    const { projectId } = this.project;
    if (!projectId) {
      this.setState({ projectTags: [] });
      return;
    }

    try {
      await globalUserStore.getUserProjects();
      const project = (globalUserStore.userProjects.data || []).find(
        (item) => item.id === projectId
      );
      if (project?.tags?.length) {
        this.setState({ projectTags: this.normalizeTags(project.tags) });
        return;
      }

      await globalTagStore.fetchList({ project_id: projectId });
      this.setState({
        projectTags: this.normalizeTags(globalTagStore.list.data),
      });
    } catch (e) {
      this.setState({ projectTags: [] });
    }
  };

  render() {
    if (!this.user) {
      return (
        <Spin
          size="small"
          style={{
            marginLeft: 8,
            marginRight: 8,
            marginTop: -24,
          }}
        />
      );
    }
    const { projectName, userDomainName } = this.project;
    const { projectTags } = this.state;
    const projectTag = projectTags.join(', ');

    const compactPrefixDisplay = projectTag
      ? `DDI: ${projectTag} | ${projectName}`
      : projectName;

    const mobileDisplay = projectTag ? `DDI: ${projectTag}` : projectName;

    const tooltipTitle = (
      <>
        <div>Project Name: {projectName}</div>
        {userDomainName && <div>Domain: {userDomainName}</div>}
        <div className={styles['project-tooltip-hint']}>
          {t('Click to switch project')}
        </div>
      </>
    );

    return (
      <div
        className={styles['project-wrap']}
        onMouseEnter={() => this.setState({ showTooltip: true })}
        onMouseLeave={this.hideTooltip}
        onMouseDown={this.hideTooltip}
      >
        <Tooltip
          visible={this.state.showTooltip}
          title={tooltipTitle}
          overlayClassName={styles['project-tooltip']}
          destroyTooltipOnHide
        >
          <div className={styles.project} id="project-switch">
            <ItemActionButtons
              actions={{ moreActions: [{ action: ProjectSelect }] }}
              onClickAction={this.hideTooltip}
            />
            <AppstoreOutlined className={styles['project-icon']} />
            <div className={styles['project-info']}>
              <span className={styles['project-name']}>
                <span className={styles['project-name-desktop']}>
                  {compactPrefixDisplay}
                  {userDomainName ? (
                    <>
                      {' '}
                      <SwapOutlined className={styles['project-toggle']} />
                      <span className={styles['project-domain']}>
                        {` ${userDomainName}`}
                      </span>
                    </>
                  ) : (
                    <>
                      {' '}
                      <SwapOutlined className={styles['project-toggle']} />
                    </>
                  )}
                </span>
                <span className={styles['project-name-mobile']}>
                  {mobileDisplay}{' '}
                  <SwapOutlined className={styles['project-toggle']} />
                </span>
              </span>
            </div>
          </div>
        </Tooltip>
      </div>
    );
  }
}

export default inject('rootStore')(observer(ProjectDropdown));
