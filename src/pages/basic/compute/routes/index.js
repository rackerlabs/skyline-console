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

import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import BasicInstance from 'pages/basic/containers/Compute/Instance';
import BasicInstanceCreate from 'pages/basic/containers/Compute/Instance/Create';
import BasicImage from 'pages/basic/containers/Compute/Image';
import BasicImageCreate from 'pages/basic/containers/Compute/Image/Create';

const PATH = '/basic/compute';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/instance`, component: BasicInstance, exact: true },
      {
        path: `${PATH}/instance/create`,
        component: BasicInstanceCreate,
        exact: true,
      },
      { path: `${PATH}/image`, component: BasicImage, exact: true },
      {
        path: `${PATH}/image/create`,
        component: BasicImageCreate,
        exact: true,
      },
      { path: '*', component: E404 },
    ],
  },
];
