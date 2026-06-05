import Edit from './Edit';
import Delete from './Delete';
import ToggleEnabled from './ToggleEnabled';
import RunNow from './RunNow';

const Create = {
  id: 'create-qonos-schedule',
  title: t('Create Schedule'),
  actionType: 'link',
  buttonType: 'primary',
  path: '/scheduled-actions/schedule/create',
  policy: '',
  aliasPolicy: 'qonos:schedules:create',
  allowed: () => Promise.resolve(true),
};

const actionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [
      {
        action: RunNow,
      },
      {
        action: ToggleEnabled,
      },
      {
        action: Delete,
      },
    ],
  },
  batchActions: [Delete],
  primaryActions: [Create],
};

export default actionConfigs;
