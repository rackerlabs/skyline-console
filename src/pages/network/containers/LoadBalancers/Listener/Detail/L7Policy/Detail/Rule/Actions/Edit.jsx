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
import { Create } from './Create';
import { canChangeRule } from '../helpers';

export class Edit extends Create {
  static id = 'l7rule-edit';

  static title = t('Edit L7 Rule');

  static buttonText = t('Edit');

  static policy = 'os_load-balancer_api:l7rule:put';

  static allowed = (item, containerProps = {}) =>
    Promise.resolve(canChangeRule(item, containerProps.detail));

  get name() {
    return t('Edit L7 Rule');
  }

  get isEdit() {
    return true;
  }

  get defaultValue() {
    const { type, compare_type, key, value, invert, admin_state_up } =
      this.item;
    return { type, compare_type, key, value, invert, admin_state_up };
  }
}
export default inject('rootStore')(observer(Edit));
