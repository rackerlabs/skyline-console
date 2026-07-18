import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import BasicNetwork from 'pages/basic/containers/Network/Network';
import BasicNetworkCreate from 'pages/basic/containers/Network/Network/Create';
import BasicPort from 'pages/basic/containers/Network/Port';
import BasicPortCreate from 'pages/basic/containers/Network/Port/Create';
import BasicFloatingIps from 'pages/basic/containers/Network/FloatingIp';
import BasicFloatingIpAllocate from 'pages/basic/containers/Network/FloatingIp/Create';
import BasicSecurityGroups from 'pages/basic/containers/Network/SecurityGroup';
import BasicSecurityGroupCreate from 'pages/basic/containers/Network/SecurityGroup/Create';
import BasicRouters from 'pages/basic/containers/Network/Router';
import BasicRouterCreate from 'pages/basic/containers/Network/Router/Create';
import BasicLoadBalancer from 'pages/basic/containers/Network/LoadBalancer';
import BasicLoadBalancerCreate from 'pages/basic/containers/Network/LoadBalancer/Create';

const PATH = '/basic/network';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/network`, component: BasicNetwork, exact: true },
      {
        path: `${PATH}/network/create`,
        component: BasicNetworkCreate,
        exact: true,
      },
      { path: `${PATH}/port`, component: BasicPort, exact: true },
      {
        path: `${PATH}/port/create`,
        component: BasicPortCreate,
        exact: true,
      },
      { path: `${PATH}/floatingip`, component: BasicFloatingIps, exact: true },
      {
        path: `${PATH}/floatingip/create`,
        component: BasicFloatingIpAllocate,
        exact: true,
      },
      {
        path: `${PATH}/security-group`,
        component: BasicSecurityGroups,
        exact: true,
      },
      {
        path: `${PATH}/security-group/create`,
        component: BasicSecurityGroupCreate,
        exact: true,
      },
      { path: `${PATH}/router`, component: BasicRouters, exact: true },
      {
        path: `${PATH}/router/create`,
        component: BasicRouterCreate,
        exact: true,
      },
      {
        path: `${PATH}/load-balancers`,
        component: BasicLoadBalancer,
        exact: true,
      },
      {
        path: `${PATH}/load-balancers/create`,
        component: BasicLoadBalancerCreate,
        exact: true,
      },
      { path: '*', component: E404 },
    ],
  },
];
