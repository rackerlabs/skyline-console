import { inject, observer } from 'mobx-react';
import { LoadBalancerInstance as AdvancedLB } from 'pages/network/containers/LoadBalancers/LoadBalancerInstance';
import { actionConfigs } from 'pages/network/containers/LoadBalancers/LoadBalancerInstance/actions';

// Link-style primary action pointing at the Basic single-page create.
const BasicCreateAction = {
  id: 'basic-lb-create',
  title: t('Create Loadbalancer'),
  actionType: 'link',
  buttonType: 'primary',
  path: '/basic/network/load-balancers/create',
  policy: 'os_load-balancer_api:loadbalancer:post',
  allowed: () => Promise.resolve(true),
};

// Basic-mode load balancer list — keeps all Advanced columns and
// actions, only the create entry point changes.
export class BasicLoadBalancer extends AdvancedLB {
  get actionConfigs() {
    return {
      ...actionConfigs,
      primaryActions: [BasicCreateAction],
    };
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicLoadBalancer));
