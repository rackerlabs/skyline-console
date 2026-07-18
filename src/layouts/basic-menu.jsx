import React from 'react';
import {
  DesktopOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  HomeOutlined,
  BookOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

// Menu for the Basic console mode. This is intentionally a small subset
// of the Advanced menu (see `menu.jsx`). Detail routes are preserved so
// breadcrumbs and deep-links keep working for the pages we do include.
const renderBasicMenu = (t) => {
  if (!t) {
    return [];
  }

  const gettingStartedUrl =
    (typeof GLOBAL_VARIABLES !== 'undefined' &&
      GLOBAL_VARIABLES.gettingStartedUrl) ||
    'https://www.youtube.com/watch?v=euINDzNBMZc&list=PLXK8KWNgW1MvNAsjegC8lm4HmR6dpHmAO';
  const documentationUrl =
    (typeof GLOBAL_VARIABLES !== 'undefined' &&
      GLOBAL_VARIABLES.documentationUrl) ||
    'https://docs.rackspacecloud.com/cloud-onboarding-welcome';

  return [
    {
      path: '/base/basic-home',
      name: t('Home'),
      key: 'basicHome',
      icon: <HomeOutlined />,
      level: 0,
      hasBreadcrumb: false,
      hasChildren: false,
    },
    {
      path: '/compute',
      name: t('Compute'),
      key: 'compute',
      icon: <DesktopOutlined />,
      children: [
        {
          path: '/basic/compute/instance',
          name: t('Instances'),
          key: 'instance',
          level: 1,
          children: [
            {
              path: /^\/compute\/instance\/detail\/.[^/]+$/,
              name: t('Instance Detail'),
              key: 'instanceDetail',
              level: 2,
              routePath: '/compute/instance/detail/:id',
            },
            {
              path: '/basic/compute/instance/create',
              name: t('Create Instance'),
              key: 'basicInstanceCreate',
              level: 2,
            },
          ],
        },
        {
          path: '/basic/compute/image',
          name: t('Images'),
          key: 'image',
          level: 1,
          children: [
            {
              path: /^\/compute\/image\/detail\/.[^/]+$/,
              name: t('Image Detail'),
              key: 'imageDetail',
              level: 2,
              routePath: '/compute/image/detail/:id',
            },
            {
              path: '/basic/compute/image/create',
              name: t('Create Image'),
              key: 'basicImageCreate',
              level: 2,
            },
          ],
        },
        {
          path: '/compute/keypair',
          name: t('Key Pairs'),
          key: 'keypair',
          level: 1,
          children: [
            {
              path: /^\/compute\/keypair\/detail\/.[^/]*$/,
              name: t('Keypair Detail'),
              key: 'keypairDetail',
              level: 2,
              routePath: '/compute/keypair/detail/:id',
            },
          ],
        },
      ],
    },
    {
      path: '/storage',
      name: t('Storage'),
      key: 'storage',
      icon: <DatabaseOutlined />,
      children: [
        {
          path: '/basic/storage/volume',
          name: t('Volumes'),
          key: 'volume',
          level: 1,
          endpoints: 'cinder',
          children: [
            {
              path: '/basic/storage/volume/create',
              name: t('Create Volume'),
              key: 'basicVolumeCreate',
              level: 2,
            },
            {
              path: /^\/storage\/volume\/detail\/.[^/]+$/,
              name: t('Volume Detail'),
              key: 'volumeDetail',
              level: 2,
              routePath: '/storage/volume/detail/:id',
            },
          ],
        },
        {
          path: '/basic/storage/container',
          name: t('Object Storage'),
          key: 'containers',
          level: 1,
          endpoints: 'swift',
          children: [
            {
              path: /^\/storage\/container\/detail\/[^/]+$/,
              name: t('Container Detail'),
              key: 'containerDetail',
              level: 2,
              routePath: '/storage/container/detail/:id',
            },
            {
              path: /^\/storage\/container\/detail\/[^/]+\/.+$/,
              name: t('Folder Detail'),
              key: 'folderDetail',
              level: 2,
              routePath: '/storage/container/detail/:container/:folder',
            },
          ],
        },
      ],
    },
    {
      path: '/network',
      name: t('Network'),
      key: '/network',
      icon: <GlobalOutlined />,
      children: [
        {
          path: '/basic/network/network',
          name: t('Networks'),
          key: 'network',
          level: 1,
          children: [
            {
              path: '/basic/network/network/create',
              name: t('Create Network'),
              key: 'basicNetworkCreate',
              level: 2,
            },
            {
              path: /^\/network\/networks\/detail\/.[^/]+$/,
              name: t('Network Detail'),
              key: 'networkDetail',
              level: 2,
              routePath: '/network/networks/detail/:id',
            },
            {
              path: /^\/network\/networks\/detail\/.[^/]+\/subnet\/.[^/]+$/,
              name: t('Subnet Detail'),
              key: 'subnetDetail',
              level: 2,
              routePath: '/network/networks/detail/:networkId/subnet/:id',
            },
          ],
        },
        {
          path: '/basic/network/port',
          name: t('Ports'),
          key: 'port',
          level: 1,
          children: [
            {
              path: '/basic/network/port/create',
              name: t('Create Virtual Adapter'),
              key: 'basicPortCreate',
              level: 2,
            },
            {
              path: /^\/network\/port\/detail\/.[^/]+$/,
              name: t('Port Detail'),
              key: 'portDetail',
              level: 2,
              routePath: '/network/port/detail/:id',
            },
            {
              path: /^\/network\/networks\/detail\/.[^/]+\/port\/.[^/]+$/,
              name: t('Port Detail'),
              key: 'networkPortDetail',
              level: 2,
              routePath: '/network/networks/detail/:networkId/port/:id',
            },
            {
              path: /^\/network\/networks\/detail\/.[^/]+\/subnet\/.[^/]+\/port\/.[^/]+$/,
              name: t('Port Detail'),
              key: 'subnetPortDetail',
              level: 2,
              routePath:
                '/network/networks/detail/:networkId/subnet/:subnetId/port/:id',
            },
            {
              path: /^\/network\/instance\/detail\/.[^/]+\/port\/.[^/]+$/,
              name: t('Port Detail'),
              key: 'instancePortDetail',
              level: 2,
              routePath: '/network/instance/detail/:instanceId/port/:id',
            },
          ],
        },
        {
          path: '/basic/network/floatingip',
          name: t('Floating IPs'),
          key: 'fip',
          level: 1,
          children: [
            {
              path: '/basic/network/floatingip/create',
              name: t('Allocate IP'),
              key: 'basicFipAllocate',
              level: 2,
            },
            {
              path: /^\/network\/floatingip\/detail\/.[^/]+$/,
              name: t('Floating Ip Detail'),
              key: 'fipDetail',
              level: 2,
              routePath: '/network/floatingip/detail/:id',
            },
          ],
        },
        {
          path: '/basic/network/security-group',
          name: t('Security Groups'),
          key: 'securityGroup',
          level: 1,
          children: [
            {
              path: '/basic/network/security-group/create',
              name: t('Create Security Group'),
              key: 'basicSecurityGroupCreate',
              level: 2,
            },
            {
              path: /^\/network\/security-group\/detail\/.[^/]+$/,
              name: t('Security Group Detail'),
              key: 'securityGroupDetail',
              level: 2,
              routePath: '/network/security-group/detail/:id',
            },
          ],
        },
        {
          path: '/basic/network/load-balancers',
          name: t('Load Balancers'),
          key: 'lb',
          endpoints: 'octavia',
          level: 1,
          children: [
            {
              path: '/basic/network/load-balancers/create',
              name: t('Create Loadbalancer'),
              key: 'basicLbCreate',
              level: 2,
            },
            {
              path: /^\/network\/load-balancers\/detail\/.[^/]+$/,
              name: t('Load Balancer Detail'),
              key: 'lbDetail',
              level: 2,
              routePath: '/network/load-balancers/detail/:id',
            },
            {
              path: /^\/network\/load-balancers\/.[^/]+\/listener\/.[^/]+$/,
              name: t('Listener Detail'),
              key: 'lbListenerDetail',
              level: 2,
              routePath: '/network/load-balancers/:loadBalancerId/listener/:id',
            },
          ],
        },
        {
          path: '/basic/network/router',
          name: t('Routers'),
          key: 'router',
          level: 1,
          children: [
            {
              path: '/basic/network/router/create',
              name: t('Create Router'),
              key: 'basicRouterCreate',
              level: 2,
            },
            {
              path: /^\/network\/router\/detail\/.[^/]+$/,
              name: t('Router Detail'),
              key: 'routerDetail',
              level: 2,
              routePath: '/network/router/detail/:id',
            },
            {
              path: /^\/network\/router\/.[^/]+\/port\/.[^/]+$/,
              name: t('Port Detail'),
              key: 'routerPortDetail',
              level: 2,
              routePath: '/network/router/:routerId/port/:id',
            },
          ],
        },
      ],
    },
    // Help section — same links Advanced surfaces at the bottom of the
    // sidebar. The `basicHelp` marker lets us style these items with a
    // subtle grey background.
    {
      type: 'divider',
      key: 'basic-help-divider',
    },
    {
      externalUrl: documentationUrl,
      name: t('Documentation'),
      key: 'documentation',
      icon: <BookOutlined />,
      level: 0,
      hasBreadcrumb: false,
      hasChildren: false,
      basicHelp: true,
      ariaLabel: t('Documentation - Opens documentation in new tab'),
    },
    {
      externalUrl: gettingStartedUrl,
      name: t('Getting Started'),
      key: 'gettingStarted',
      icon: <PlayCircleOutlined />,
      level: 0,
      hasBreadcrumb: false,
      hasChildren: false,
      basicHelp: true,
      ariaLabel: t('Getting Started - Opens video tutorials in new tab'),
    },
  ];
};

export default renderBasicMenu;
