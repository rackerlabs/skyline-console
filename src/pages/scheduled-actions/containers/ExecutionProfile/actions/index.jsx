import Create from './Create';
import Edit from './Edit';
import Delete from './Delete';
import ToggleEnabled from './ToggleEnabled';

const actionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [
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
