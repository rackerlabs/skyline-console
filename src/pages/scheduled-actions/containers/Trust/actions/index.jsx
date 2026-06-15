import Create from './Create';
import Delete from './Delete';

const actionConfigs = {
  rowActions: {
    firstAction: Delete,
    moreActions: [],
  },
  batchActions: [Delete],
  primaryActions: [Create],
};

export default actionConfigs;
