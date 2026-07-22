import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Schedule from '../containers/Schedule';
import ScheduleCreate from '../containers/Schedule/actions/Create';
import ScheduleDetail from '../containers/Schedule/Detail';
import ExecutionProfile from '../containers/ExecutionProfile';
import Trust from '../containers/Trust';
import Job from '../containers/Job';
import JobDetail from '../containers/Job/Detail';

const PATH = '/scheduled-actions';
const dual = (name, component, suffix = '') => [
  { path: `${PATH}/${name}${suffix}`, component, exact: true },
  { path: `${PATH}/${name}-admin${suffix}`, component, exact: true },
];

export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      ...dual('schedule', Schedule),
      ...dual('schedule', ScheduleCreate, '/create'),
      ...dual('schedule', ScheduleDetail, '/detail/:id'),
      ...dual('execution-profile', ExecutionProfile),
      ...dual('job', Job),
      ...dual('job', JobDetail, '/detail/:id'),
      { path: `${PATH}/trust-admin`, component: Trust, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
