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
import { CreateForm as AdvancedCreateForm } from 'pages/compute/containers/Image/actions/Create';

// Basic-mode image create. Keeps only the fields marked required in the
// Advanced form (Name, File/URL, Disk Format, Container Format when
// visible, and OS / OS Version / OS Admin when disk format is bare).
// No table pickers exist in the non-admin flow, so there is nothing
// to swap to a searchable Select here — everything is already a plain
// Select or Input.
export class BasicImageCreate extends AdvancedCreateForm {
  static id = 'basic-image-create';

  static path = '/basic/compute/image/create';

  // Basic mode is always the project user view.
  get isAdminPage() {
    return false;
  }

  get listUrl() {
    return '/basic/compute/image';
  }

  get formItems() {
    const items = super.formItems;
    // Whitelist by name — everything else is dropped. Kept in the
    // same order they appear in Advanced so the visual layout matches.
    const keep = new Set([
      'name',
      'uploadType',
      'file',
      'url',
      'disk_format',
      'container_format',
      'os_distro',
      'os_version',
      'os_admin_user',
    ]);
    return items.filter((it) => keep.has(it.name));
  }
}

export default inject('rootStore')(observer(BasicImageCreate));
