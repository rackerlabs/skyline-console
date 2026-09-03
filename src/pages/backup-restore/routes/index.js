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

import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Jobs from '../containers/Job';
import JobDetail from '../containers/Job/Detail';
import Actions from '../containers/Action';
import ActionDetail from '../containers/Action/Detail';
import Clients from '../containers/Client';
import Backups from '../containers/Backup';

const PATH = '/backup-restore';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/job`, component: Jobs, exact: true },
      { path: `${PATH}/job/detail/:id`, component: JobDetail, exact: true },
      { path: `${PATH}/action`, component: Actions, exact: true },
      {
        path: `${PATH}/action/detail/:id`,
        component: ActionDetail,
        exact: true,
      },
      { path: `${PATH}/client`, component: Clients, exact: true },
      { path: `${PATH}/backup`, component: Backups, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
