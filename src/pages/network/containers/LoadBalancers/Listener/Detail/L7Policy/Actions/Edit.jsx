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
import { l7PolicyActions } from 'resources/octavia/l7policy';
import { Create } from './Create';
import { canChangePolicy } from '../helpers';

export class Edit extends Create {
  static id = 'l7policy-edit';

  static title = t('Edit L7 Policy');

  static buttonText = t('Edit');

  static policy = 'os_load-balancer_api:l7policy:put';

  static allowed = (item, containerProps = {}) =>
    Promise.resolve(
      canChangePolicy(item, containerProps.detail) &&
        l7PolicyActions.includes(item.action)
    );

  get name() {
    return t('Edit L7 Policy');
  }

  get isEdit() {
    return true;
  }

  get defaultValue() {
    const {
      name,
      description,
      action,
      position,
      admin_state_up,
      redirect_url,
      redirect_pool_id,
      redirect_http_code = 302,
    } = this.item;
    return {
      name,
      description,
      action,
      position,
      admin_state_up,
      redirect_url,
      redirect_pool_id,
      redirect_http_code,
    };
  }
}

export default inject('rootStore')(observer(Edit));
