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

import { inject, observer } from 'mobx-react';
import globalImageStore from 'stores/glance/image';
import globalServerStore from 'stores/nova/instance';
import globalInstanceSnapshotStore from 'stores/glance/instance-snapshot';
import { InstanceVolumeStore } from 'stores/nova/instance-volume';
import { SnapshotStore } from 'stores/cinder/snapshot';
import { ModalAction } from 'containers/Action';
import {
  isActiveOrShutOff,
  isNotLocked,
  isIsoInstance,
} from 'resources/nova/instance';
import {
  getImageOS,
  getImageColumns,
  canImageCreateInstance,
  getImageSystemTabs,
  imageFormats,
  imageStatus,
} from 'resources/glance/image';
import { isOsDisk } from 'resources/cinder/volume';

export class Rebuild extends ModalAction {
  static id = 'rebuild';

  static title = t('Rebuild Instance');

  init() {
    this.store = globalServerStore;
    this.imageStore = globalImageStore;
    this.instanceSnapshotStore = globalInstanceSnapshotStore;
    this.instanceVolumeStore = new InstanceVolumeStore();
    this.snapshotStore = new SnapshotStore();
    this.getImages();
    this.getInstanceSnapshots();
    this.getRootVolumeSnapshots();
    // Initialize source state to match default value
    this.setState({
      source: 'image',
    });
  }

  get name() {
    return t('rebuild instance');
  }

  static get modalSize() {
    return 'large';
  }

  get labelCol() {
    return {
      xs: { span: 6 },
      sm: { span: 4 },
    };
  }

  get tips() {
    return t(
      'If the root disk has a snapshot, it will affect the deletion of the original disk during reconstruction or the recovery of the instance snapshot.'
    );
  }

  get images() {
    const { imageTab } = this.state;
    const images = (this.imageStore.list.data || []).filter((it) => {
      if (!canImageCreateInstance(it)) {
        return false;
      }
      if (imageTab) {
        return getImageOS(it) === imageTab;
      }
      return true;
    });
    return images.map((it) => ({
      ...it,
      key: it.id,
    }));
  }

  getImages() {
    this.imageStore.fetchList({ all_projects: this.hasAdminRole });
  }

  getInstanceSnapshots() {
    this.instanceSnapshotStore.fetchList();
  }

  async getRootVolumeSnapshots() {
    const volumes = await this.instanceVolumeStore.fetchList({
      serverId: this.item.id,
    });
    const rootDisk = volumes.find((v) => isOsDisk(v));
    if (!rootDisk) {
      return;
    }
    const snapshots = await this.snapshotStore.fetchList({ id: rootDisk.id });
    this.setState({ snapshots });
  }

  get systemTabs() {
    return getImageSystemTabs();
  }

  get defaultValue() {
    const { name } = this.item;
    const value = {
      instance: name,
      source: this.imageSourceType?.value || 'image',
    };
    return value;
  }

  get sourceTypes() {
    return [
      { label: t('Image'), value: 'image' },
      { label: t('Instance Snapshot'), value: 'instanceSnapshot' },
    ];
  }

  get imageSourceType() {
    return this.sourceTypes.find((it) => it.value === 'image');
  }

  get snapshotSourceType() {
    return this.sourceTypes.find((it) => it.value === 'instanceSnapshot');
  }

  get sourceTypeIsImage() {
    const { source } = this.state || {};
    const sourceValue = source?.value || source;
    return sourceValue === 'image';
  }

  get sourceTypeIsSnapshot() {
    const { source } = this.state || {};
    const sourceValue = source?.value || source;
    return sourceValue === 'instanceSnapshot';
  }

  onSourceChange = (value) => {
    // Handle wrapped value from radio button
    const sourceValue = value?.value || value;
    this.setState({
      source: sourceValue,
    });
  };

  static policy = 'os_compute_api:servers:rebuild';

  // todo:
  static isRootVolumeInUse = () => true;

  static allowed = (item) => {
    const result =
      isActiveOrShutOff(item) &&
      isNotLocked(item) &&
      this.isRootVolumeInUse(item) &&
      !isIsoInstance(item);
    return Promise.resolve(result);
  };

  onImageTabChange = (value) => {
    this.setState({
      imageTab: value,
    });
  };

  get instanceExtra() {
    const { snapshots = [] } = this.state;
    if (!snapshots.length) {
      return '';
    }
    return t('The root disk of the instance has snapshots');
  }

  get snapshots() {
    const {
      list: { data },
    } = this.instanceSnapshotStore;
    return (data || []).filter((it) => it.status === 'active');
  }

  get instanceSnapshotColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Disk Format'),
        dataIndex: 'disk_format',
        valueMap: imageFormats,
      },
      {
        title: t('Min System Disk'),
        dataIndex: 'min_disk',
        unit: 'GiB',
      },
      {
        title: t('Min Memory'),
        dataIndex: 'min_ram',
        render: (text) => `${text / 1024}GiB`,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: imageStatus,
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        isHideable: true,
        valueRender: 'sinceTime',
      },
    ];
  }

  get formItems() {
    return [
      {
        name: 'instance',
        label: t('Instance'),
        type: 'label',
        iconType: 'instance',
        extra: this.instanceExtra,
      },
      {
        type: 'divider',
      },
      {
        name: 'source',
        label: t('Start Source'),
        type: 'radio',
        options: this.sourceTypes,
        required: true,
        isWrappedValue: true,
        tip: t(
          'The start source is a template used to rebuild an instance. You can choose an image or an instance snapshot.'
        ),
        onChange: this.onSourceChange,
      },
      {
        name: 'image',
        label: t('Operating System'),
        type: 'select-table',
        data: this.images,
        isLoading: this.imageStore.list.isLoading,
        required: this.sourceTypeIsImage,
        isMulti: false,
        display: this.sourceTypeIsImage,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: getImageColumns(this),
        tabs: this.systemTabs,
        defaultTabValue: this.systemTabs[0]?.value,
        selectedLabel: t('Image'),
        onTabChange: this.onImageTabChange,
      },
      {
        name: 'instanceSnapshot',
        label: t('Instance Snapshot'),
        type: 'select-table',
        data: this.snapshots,
        isLoading: this.instanceSnapshotStore.list.isLoading,
        required: this.sourceTypeIsSnapshot,
        isMulti: false,
        hidden: !this.sourceTypeIsSnapshot,
        display: this.sourceTypeIsSnapshot,
        filterParams: [
          {
            label: t('Name'),
            name: 'name',
          },
        ],
        columns: this.instanceSnapshotColumns,
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const {
      image: { selectedRowKeys: imageKeys = [] } = {},
      instanceSnapshot: { selectedRowKeys: snapshotKeys = [] } = {},
    } = values;
    // Instance snapshots are Glance images, so they can be used as imageRef
    const imageId = snapshotKeys[0] || imageKeys[0];
    return this.store.rebuild({ id, image: imageId });
  };
}

export default inject('rootStore')(observer(Rebuild));
