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
import globalFreezerJobStore from 'stores/freezer/job';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Job');
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('Delete Job');
  }

  get isDanger() {
    return true;
  }

  policy = 'freezer:job:delete';

  allowedCheckFunc = (item) => item.status !== 'running';

  onSubmit = (item) => globalFreezerJobStore.delete({ id: item.id });
}
