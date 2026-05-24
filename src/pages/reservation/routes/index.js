import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Lease from '../containers/Lease';
import LeaseDetail from '../containers/Lease/Detail';
import LeaseCreate from '../containers/Lease/actions/Create';

const PATH = '/reservation';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/lease`, component: Lease, exact: true },
      { path: `${PATH}/lease/create`, component: LeaseCreate, exact: true },
      { path: `${PATH}/lease/detail/:id`, component: LeaseDetail, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
