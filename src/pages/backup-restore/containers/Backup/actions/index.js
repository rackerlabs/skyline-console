import Delete from './Delete';
import Restore from './Restore';

const actionConfigs = {
  rowActions: {
    firstAction: Restore,
    moreActions: [{ action: Delete }],
  },
  batchActions: [Delete],
  primaryActions: [],
};

export default actionConfigs;
