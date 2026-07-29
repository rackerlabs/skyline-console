import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import BasicVolume from 'pages/basic/containers/Storage/Volume';
import BasicVolumeCreate from 'pages/basic/containers/Storage/Volume/Create';
import Container from 'pages/storage/containers/Container';

const PATH = '/basic/storage';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/volume`, component: BasicVolume, exact: true },
      {
        path: `${PATH}/volume/create`,
        component: BasicVolumeCreate,
        exact: true,
      },
      // Object Storage is used as-is from the Advanced flow — no
      // trimming needed, so we reuse the existing component directly.
      { path: `${PATH}/container`, component: Container, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
