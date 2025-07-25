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

import { ConfirmAction } from 'containers/Action';
import globalPoolMemberStore from 'stores/octavia/pool-member';

export default class DisableAction extends ConfirmAction {
  get id() {
    return 'disable';
  }

  get title() {
    return t('Disable Member');
  }

  get isDanger() {
    return false;
  }

  get buttonText() {
    return t('Disable');
  }

  get actionName() {
    return t('disable member');
  }

  policy = 'os_load-balancer_api:member:put';

  allowedCheckFunc = (item) => {
    if (!item) return true;
    return (
      this.isOwnerOrAdmin(item) &&
      item.provisioning_status === 'ACTIVE' &&
      item.admin_state_up
    );
  };

  isOwnerOrAdmin() {
    // TODO: check owner
    return true;
  }

  onSubmit = (values) => {
    const { default_pool_id } = this.containerProps.detail;
    const { id } = values;
    const data = {
      admin_state_up: false,
    };
    return globalPoolMemberStore.update({
      member_id: id,
      default_pool_id,
      data,
    });
  };
}
