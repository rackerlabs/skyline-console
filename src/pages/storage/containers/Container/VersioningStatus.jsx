import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Skeleton, Tag } from 'antd';
import globalContainerStore from 'stores/swift/container';
import {
  getVersioningLabel,
  getVersioningTagColor,
  VERSIONING_UNKNOWN,
} from 'resources/swift/versioning';

export function renderVersioningTag(state) {
  if (!state || state === VERSIONING_UNKNOWN) {
    return '-';
  }
  return (
    <Tag color={getVersioningTagColor(state)}>{getVersioningLabel(state)}</Tag>
  );
}

// Versioning cell. It mounts only for rows of the visible page while the
// Versioning column is shown, so the per-container HEAD is issued only then.
export class VersioningStatus extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate() {
    // Re-fetch if the cached entry was dropped (e.g. container re-created).
    this.load();
  }

  load() {
    const { name } = this.props;
    if (name && !globalContainerStore.versioningMap.has(name)) {
      globalContainerStore.fetchVersioning(name);
    }
  }

  render() {
    const { name } = this.props;
    const info = globalContainerStore.versioningMap.get(name);
    if (!info) {
      return <Skeleton.Button active size="small" />;
    }
    return renderVersioningTag(info.state);
  }
}

export default observer(VersioningStatus);
