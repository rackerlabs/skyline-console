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
import globalNetworkStore from 'stores/neutron/network';
import globalPortStore from 'stores/neutron/port-extension';
import { checkSystemAdmin } from 'resources/skyline/policy';
import globalRootStore from 'stores/root';

export default class DeleteAction extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Network');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete network');
  }

  policy = 'delete_network';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return this.isCurrentProject(item);
  };

  isCurrentProject(item) {
    const rootStore = globalRootStore;
    if (!checkSystemAdmin() && item.project_id !== rootStore.user.project.id) {
      return false;
    }
    return true;
  }

  onSubmit = async (data) => {
    const { id } = data;
    // Delete OVN metadata ports before deleting the network.
    // These ports (device_owner starting with 'network:distributed') are
    // internal OVN metadata service ports that are not automatically removed
    // by the API when the network is deleted via the UI.
    try {
      const ports = await globalPortStore.pureFetchList({ network_id: id });
      const ovnMetaPorts = ports.filter(
        (p) =>
          p.device_owner && p.device_owner.startsWith('network:distributed')
      );
      if (ovnMetaPorts.length) {
        await Promise.all(ovnMetaPorts.map((p) => globalPortStore.delete(p)));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        'Failed to clean up OVN metadata ports before network deletion',
        e
      );
    }
    return globalNetworkStore.delete(data);
  };
}
