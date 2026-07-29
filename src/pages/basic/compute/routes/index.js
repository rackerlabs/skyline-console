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
