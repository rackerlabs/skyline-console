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

import { observer, inject } from 'mobx-react';
import Base from 'containers/TabList';
import BannerList from './BannerList';

export class MessageBanner extends Base {
  get tabs() {
    return [
      {
        title: t('Maintenance'),
        key: 'maintenance',
        component: BannerList,
      },
      {
        title: t('Notifications'),
        key: 'notification',
        component: BannerList,
      },
    ];
  }
}

export default inject('rootStore')(observer(MessageBanner));
