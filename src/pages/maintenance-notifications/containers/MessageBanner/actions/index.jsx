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

import Create from './CreateMaintenance';
import CreateNotification from './CreateNotification';
import Delete from './Delete';
import Edit from './Edit';
import ToggleEnabled from './ToggleEnabled';

const maintenanceActionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [{ action: ToggleEnabled }, { action: Delete }],
  },
  batchActions: [],
  primaryActions: [Create],
};

const notificationActionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [{ action: ToggleEnabled }, { action: Delete }],
  },
  batchActions: [],
  primaryActions: [CreateNotification],
};

export { maintenanceActionConfigs, notificationActionConfigs };
export default maintenanceActionConfigs;
