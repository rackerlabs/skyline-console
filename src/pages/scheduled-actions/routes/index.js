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
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/schedule`, component: Schedule, exact: true },
      {
        path: `${PATH}/schedule/create`,
        component: ScheduleCreate,
        exact: true,
      },
      {
        path: `${PATH}/schedule/detail/:id`,
        component: ScheduleDetail,
        exact: true,
      },
      {
        path: `${PATH}/execution-profile`,
        component: ExecutionProfile,
        exact: true,
      },
      { path: `${PATH}/trust-admin`, component: Trust, exact: true },
      { path: `${PATH}/job`, component: Job, exact: true },
      { path: `${PATH}/job/detail/:id`, component: JobDetail, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
