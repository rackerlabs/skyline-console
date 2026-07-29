import { inject, observer } from 'mobx-react';
import { SecurityGroups as AdvancedSecurityGroups } from 'pages/network/containers/SecurityGroup';
import actionConfigs from 'pages/network/containers/SecurityGroup/actions';
import BasicCreateAction from './actions/BasicCreateAction';

// Basic-mode security group list. Reuses Advanced list; trims columns
// to: ID/Name, Description, Created At, Actions.
export class BasicSecurityGroups extends AdvancedSecurityGroups {
  get actionConfigs() {
    return {
      ...actionConfigs.actionConfigs,
      primaryActions: [BasicCreateAction],
    };
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('securityGroupDetail'),
    },
    {
      title: t('Description'),
      dataIndex: 'description',
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'sinceTime',
    },
  ];

  get searchFilters() {
    return [
      { label: t('ID'), name: 'id' },
      { label: t('Name'), name: 'name' },
    ];
  }

  get hideCustom() {
    return true;
  }
}

export default inject('rootStore')(observer(BasicSecurityGroups));
