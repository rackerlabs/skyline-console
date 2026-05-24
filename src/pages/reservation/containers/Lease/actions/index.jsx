import Create from './Create';
import Edit from './Edit';
import Delete from './Delete';
import UseInstance from './UseInstance';
import ViewFloatingIps from './ViewFloatingIps';

const actionConfigs = {
  rowActions: {
    firstAction: Edit,
    moreActions: [
      {
        action: UseInstance,
      },
      {
        action: ViewFloatingIps,
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
