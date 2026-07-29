import { inject, observer } from 'mobx-react';
import { Routes as AdvancedRouters } from 'pages/network/containers/Router';
import actionConfigs from 'pages/network/containers/Router/actions';

// Link-style primary action pointing at the Basic single-page create.
// `buttonType: 'primary'` is what the class-based actions inherit from
// FormAction — without it the button falls back to the default outline
// style instead of the primary (Rackspace red) one used elsewhere.
const BasicCreateAction = {
  id: 'basic-router-create',
  title: t('Create Router'),
  actionType: 'link',
  buttonType: 'primary',
  path: '/basic/network/router/create',
  policy: 'create_router',
  allowed: () => Promise.resolve(true),
};

// Basic-mode router list. Reuses everything from the Advanced list
// (all columns, filters, actions) — only the create entry point is
// swapped for the single-page Basic form.
export class BasicRouters extends AdvancedRouters {
  get actionConfigs() {
    return {
      ...actionConfigs.actionConfigs,
      primaryActions: [BasicCreateAction],
    };
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicRouters));
