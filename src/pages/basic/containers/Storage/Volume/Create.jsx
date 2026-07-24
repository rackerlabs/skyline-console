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
import { toJS } from 'mobx';
import { FormAction } from 'containers/Action';
import globalVolumeStore from 'stores/cinder/volume';
import globalVolumeTypeStore from 'stores/cinder/volume-type';
import globalProjectStore from 'stores/keystone/project';
import globalImageStore from 'stores/glance/image';
import globalSnapshotStore from 'stores/cinder/snapshot';
import {
  canImageCreateInstance,
  canImageCreateIronicInstance,
  getImageOS,
  imageOS,
} from 'resources/glance/image';
import {
  fetchQuota,
  getQuota,
  multiTip,
  snapshotTypeTip,
  onVolumeSizeChange,
  setCreateVolumeSize,
  setCreateVolumeType,
  setCreateVolumeCount,
} from 'resources/cinder/volume';

// Basic-mode volume create. Mirrors the Advanced form's required
// fields and their behaviours (volume-type dependent size floor,
// quota-aware max, snapshot auto-picks type). Table pickers are the
// only thing swapped — for searchable Selects.
export class BasicVolumeCreate extends FormAction {
  static id = 'basic-volume-create';

  static title = t('Create Volume');

  static path = '/basic/storage/volume/create';

  static policy = 'volume:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalVolumeStore;
    this.imageStore = globalImageStore;
    this.snapshotStore = globalSnapshotStore;
    this.volumeTypeStore = globalVolumeTypeStore;
    this.projectStore = globalProjectStore;
    this.state = {
      ...(this.state || {}),
      quota: {},
      quotaLoading: true,
    };
    this.loadResources();
  }

  async loadResources() {
    await Promise.all([
      this.store.fetchAvailabilityZoneList(),
      this.imageStore.fetchList({ all_projects: false }),
      this.snapshotStore.fetchList(),
      this.volumeTypeStore.fetchList({ showQoS: true }),
      fetchQuota(this, 0),
    ]);
    // Prime "current volume type" name for quota calculation.
    const first = this.rawVolumeTypes[0];
    if (first) {
      setCreateVolumeType(first.name);
    }
    setCreateVolumeCount(1);
    const initialSize = this.defaultSize;
    setCreateVolumeSize(initialSize);
    this.updateDefaultValue();
    // Form's `initialValues` were captured when the form first
    // mounted — before quota / volume types had loaded — so a plain
    // resetFields snaps size back to the pre-load default (often 0).
    // Push the freshly computed defaults into the live form so the
    // slider and volume type appear with real values.
    this.formRef?.current?.setFieldsValue({
      size: initialSize,
      volumeType: first?.id,
      availableZone: this.availabilityZones[0]?.value,
    });
  }

  get name() {
    return t('create volume');
  }

  get listUrl() {
    return '/basic/storage/volume';
  }

  get nameForStateUpdate() {
    // Watch source + source picks so the size min / max recompute and
    // the slider bounds redraw when the user changes them. Size itself
    // is NOT in the list — antd Form owns that value and re-adding it
    // to state on every keystroke causes the slider to lag behind the
    // input.
    return ['source', 'volumeType', 'image', 'snapshot'];
  }

  // ---------- Option lists ----------

  get availabilityZones() {
    return (this.store.availabilityZones || [])
      .filter((it) => it.zoneState && it.zoneState.available)
      .map((it) => ({ value: it.zoneName, label: it.zoneName }));
  }

  get sourceTypes() {
    return [
      { value: 'blank-volume', label: t('Blank Volume') },
      { value: 'image', label: t('Image') },
      { value: 'snapshot', label: t('Volume Snapshot') },
    ];
  }

  get imageRows() {
    return (this.imageStore.list.data || []).filter(
      (it) => canImageCreateInstance(it) || canImageCreateIronicInstance(it)
    );
  }

  get images() {
    return this.imageRows.map((it) => {
      const os = getImageOS(it);
      const osLabel = imageOS[os] || os || '';
      return {
        value: it.id,
        label: osLabel ? `${it.name} · ${osLabel}` : it.name,
      };
    });
  }

  get snapshotRows() {
    return this.snapshotStore.list.data || [];
  }

  get snapshots() {
    return this.snapshotRows.map((it) => ({
      value: it.id,
      label: `${it.name || it.id} · ${it.size} GiB`,
    }));
  }

  // Advanced hides "special" volume types whose name starts with `__`
  // unless every type is special. Mirror that exactly.
  get rawVolumeTypes() {
    const list = toJS(this.volumeTypeStore.list.data) || [];
    const hasNonSpecialName = list.some((it) => !it.name.startsWith('__'));
    return hasNonSpecialName
      ? list.filter((it) => !it.name.startsWith('__'))
      : list;
  }

  get volumeTypes() {
    return this.rawVolumeTypes.map((it) => ({
      value: it.id,
      label: it.name,
    }));
  }

  // ---------- Derived state ----------

  get currentSource() {
    return this.state.source || 'blank-volume';
  }

  get isImageSource() {
    return this.currentSource === 'image';
  }

  get isSnapshotSource() {
    return this.currentSource === 'snapshot';
  }

  get selectedImage() {
    if (!this.isImageSource) return null;
    const id = this.state.image;
    if (!id) return null;
    return this.imageRows.find((it) => it.id === id) || null;
  }

  get selectedSnapshot() {
    if (!this.isSnapshotSource) return null;
    const id = this.state.snapshot;
    if (!id) return null;
    return this.snapshotRows.find((it) => it.id === id) || null;
  }

  get selectedVolumeType() {
    const id = this.state.volumeType;
    if (!id) return null;
    return this.rawVolumeTypes.find((it) => it.id === id) || null;
  }

  // Quota
  get volumeQuota() {
    return getQuota(this.state.quota || {});
  }

  get quotaIsLimit() {
    const { gigabytes: { limit } = {} } = this.volumeQuota;
    return limit !== -1;
  }

  get maxSize() {
    const { gigabytes: { left = 0 } = {} } = this.volumeQuota;
    return left === -1 ? 1000 : left;
  }

  // Min disk enforced by the source (image / snapshot).
  get sourceMinDisk() {
    if (this.isImageSource && this.selectedImage) {
      const { min_disk = 0, size = 0 } = this.selectedImage;
      const sizeGiB = Math.ceil(size / 1024 / 1024 / 1024);
      return Math.max(min_disk, sizeGiB, 1);
    }
    if (this.isSnapshotSource && this.selectedSnapshot) {
      return this.selectedSnapshot.size || 1;
    }
    return 1;
  }

  // Min size enforced by the selected volume type
  // (`provisioning:min_vol_size` extra spec).
  get volumeTypeMinSize() {
    const raw =
      this.selectedVolumeType?.extra_specs?.['provisioning:min_vol_size'];
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  get diskMinSize() {
    return Math.max(this.sourceMinDisk, 1);
  }

  get effectiveMinSize() {
    return Math.max(this.volumeTypeMinSize, this.diskMinSize);
  }

  // Default is 10 GiB (capped by quota), pushed up to whatever the
  // selected volume type / source demand. Slider floor is separate
  // (see diskMinSize in formItems); a warning fires via the validator
  // if the user drags below the volume type's minimum. When quota
  // hasn't loaded yet, `maxSize` is 0 and would clip the default to 0;
  // fall back to a sane default so the slider starts with a real
  // value on first mount.
  get defaultSize() {
    if (this.state.quotaLoading) {
      return 10;
    }
    const base = this.quotaIsLimit && this.maxSize < 10 ? this.maxSize : 10;
    const min = this.effectiveMinSize;
    const target = min > 0 ? Math.max(base, min) : base;
    return this.maxSize > 0 ? Math.min(target, this.maxSize) : target;
  }

  get isMultiattachType() {
    return this.selectedVolumeType?.extra_specs?.multiattach === '<is> True';
  }

  get defaultVolumeTypeId() {
    return this.rawVolumeTypes[0]?.id;
  }

  get defaultValue() {
    return {
      project: this.currentProjectName,
      source: 'blank-volume',
      availableZone: this.availabilityZones[0]?.value,
      volumeType: this.defaultVolumeTypeId,
      size: this.defaultSize,
    };
  }

  // ---------- Change handlers ----------

  onVolumeTypeChange = (value) => {
    const selected = this.rawVolumeTypes.find((it) => it.id === value);
    if (!selected) {
      setCreateVolumeType('');
      return;
    }
    setCreateVolumeType(selected.name);
    // Push size up if the new type has a higher min.
    const nextMin = Math.max(this.volumeTypeMinSize, this.diskMinSize, 1);
    // Re-read min from the new selection (state hasn't flushed yet).
    const raw = selected?.extra_specs?.['provisioning:min_vol_size'];
    const typeMin = raw ? parseInt(raw, 10) || 0 : 0;
    const effectiveMin = Math.max(typeMin, this.diskMinSize, 1, nextMin);
    const current = this.formRef?.current?.getFieldValue('size');
    if (!current || current < effectiveMin) {
      const nextSize = Math.min(effectiveMin, this.maxSize);
      this.formRef?.current?.setFieldsValue({ size: nextSize });
      setCreateVolumeSize(nextSize);
    }
  };

  onSnapshotChange = async (value) => {
    if (!value) return;
    // Advanced auto-selects the source volume's type when a snapshot is
    // chosen and warns before letting the user change it. Basic just
    // auto-selects — that's the same behavioural intent without needing
    // the extra confirmation modal.
    const snapshot = this.snapshotRows.find((it) => it.id === value);
    if (!snapshot) return;
    let volumeTypeId = snapshot.origin_data?.volume_type_id;
    if (!volumeTypeId) {
      try {
        const detail = await this.snapshotStore.fetchDetail({ id: value });
        const { volume: { volume_type: name } = {} } = detail || {};
        const match = this.rawVolumeTypes.find((it) => it.name === name);
        volumeTypeId = match?.id;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('volume already not exist', e);
      }
    }
    if (volumeTypeId) {
      this.formRef?.current?.setFieldsValue({ volumeType: volumeTypeId });
      // Give the state a tick to update so the size sync uses the new
      // type's min.
      setTimeout(() => this.onVolumeTypeChange(volumeTypeId), 0);
    }
  };

  validateSize = (rule, value) => {
    if (value === undefined || value === null) {
      return Promise.resolve();
    }
    const max = this.maxSize;
    if (max > 0 && value > max) {
      return Promise.reject(
        new Error(t('Size cannot exceed {size} GiB.', { size: max }))
      );
    }
    const typeMin = this.volumeTypeMinSize;
    const name = this.selectedVolumeType?.name;
    if (typeMin > 0 && value < typeMin) {
      const message = name
        ? t('Size must be at least {size} GiB for volume type "{name}".', {
            size: typeMin,
            name,
          })
        : t('Size must be at least {size} GiB for the selected volume type.', {
            size: typeMin,
          });
      return Promise.reject(new Error(message));
    }
    const sourceMin = this.sourceMinDisk;
    if (sourceMin > 1 && value < sourceMin) {
      return Promise.reject(
        new Error(
          t('Size must be at least {size} GiB to fit the selected source.', {
            size: sourceMin,
          })
        )
      );
    }
    return Promise.resolve();
  };

  // Tip surfaced next to the Volume Type — mirrors Advanced.
  getVolumeTypeExtra() {
    if (this.isSnapshotSource) {
      return snapshotTypeTip;
    }
    if (this.isMultiattachType) {
      return multiTip;
    }
    return undefined;
  }

  // ---------- Form items ----------

  get formItems() {
    const searchable = {
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: t('Search'),
    };
    // Slider bounds mirror Advanced: floor is the source's min disk
    // (or 1 for a blank volume), so the pointer can slide down that
    // far. The volume-type's `provisioning:min_vol_size` is enforced
    // by the validator, not by clipping the slider.
    const minSize = this.diskMinSize;
    return [
      {
        name: 'availableZone',
        label: t('Availability Zone'),
        type: 'select',
        options: this.availabilityZones,
        disabled: true,
        showSearch: false,
        placeholder: t('Please select'),
        tip: t(
          'A logical grouping of resources that controls resource placement. Availability zones help isolate workloads and improve fault tolerance.'
        ),
      },
      { type: 'divider' },
      {
        name: 'source',
        label: t('Data Source Type'),
        type: 'radio',
        required: true,
        options: this.sourceTypes,
      },
      {
        name: 'image',
        label: t('Operating System'),
        type: 'select',
        required: this.isImageSource,
        hidden: !this.isImageSource,
        loading: this.imageStore.list.isLoading,
        options: this.images,
        ...searchable,
      },
      {
        name: 'snapshot',
        label: t('Volume Snapshot'),
        type: 'select',
        required: this.isSnapshotSource,
        hidden: !this.isSnapshotSource,
        loading: this.snapshotStore.list.isLoading,
        options: this.snapshots,
        onChange: this.onSnapshotChange,
        ...searchable,
      },
      { type: 'divider' },
      {
        name: 'volumeType',
        label: t('Volume Type'),
        type: 'select',
        required: true,
        loading: this.volumeTypeStore.list.isLoading,
        options: this.volumeTypes,
        onChange: this.onVolumeTypeChange,
        extra: this.getVolumeTypeExtra(),
        ...searchable,
      },
      // Basic uses a plain number input for size (no slider). The
      // allowed range sits under the field. Dropping below the volume
      // type's `provisioning:min_vol_size` triggers a warning through
      // the validator, matching Advanced's UX.
      {
        name: 'size',
        label: t('Size (GiB)'),
        type: 'input-int',
        required: true,
        min: minSize,
        max: this.maxSize,
        onChange: onVolumeSizeChange,
        validator: this.validateSize,
        extra: t('Allowed: {min} GiB - {max} GiB.', {
          min: minSize,
          max: this.maxSize,
        }),
      },
      { type: 'divider' },
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        placeholder: t('Please input name'),
      },
    ];
  }

  // ---------- Submit ----------

  onSubmit = (submitValues) => {
    const { name, availableZone, source, image, snapshot, volumeType, size } =
      submitValues;
    const volume = {
      name,
      size,
      availability_zone: availableZone || null,
      volume_type: volumeType,
      multiattach: this.isMultiattachType,
    };
    if (source === 'image' && image) {
      volume.imageRef = image;
    }
    if (source === 'snapshot' && snapshot) {
      volume.snapshot_id = snapshot;
    }
    // Notification is handled by BaseForm.onOk (success + error).
    return this.store.create(volume);
  };
}

export default inject('rootStore')(observer(BasicVolumeCreate));
