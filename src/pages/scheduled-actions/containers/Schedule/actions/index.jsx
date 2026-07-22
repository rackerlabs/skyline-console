import { getScheduleCreatePath } from 'resources/qonos';
import Edit from './Edit';
import Delete from './Delete';
import ToggleEnabled from './ToggleEnabled';

const Create = {
  id: 'create-qonos-schedule',
  title: t('Create Schedule'),
  actionType: 'link',
  buttonType: 'primary',
  path: (_, containerProps) =>
    getScheduleCreatePath(containerProps?.isAdminPage),
  policy: '',
  aliasPolicy: 'qonos:schedules:create',
  allowed: () => Promise.resolve(true),
};

const actionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [{ action: ToggleEnabled }, { action: Delete }],
  },
  batchActions: [Delete],
  primaryActions: [Create],
};

export default actionConfigs;
