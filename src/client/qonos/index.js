import Base from '../client/base';
import { qonosBase } from '../client/constants';

export class QonosClient extends Base {
  get baseUrl() {
    return qonosBase();
  }

  get resources() {
    return [
      {
        key: 'schedules',
        responseKey: 'schedule',
      },
      {
        name: 'executionProfiles',
        key: 'execution-profiles',
        responseKey: 'execution_profile',
      },
      {
        key: 'jobs',
        responseKey: 'job',
        extendOperations: [
          {
            name: 'cancel',
            key: 'cancel',
            method: 'post',
          },
        ],
        subResources: [
          {
            name: 'executions',
            key: 'executions',
            responseKey: 'execution',
          },
        ],
      },
      {
        key: 'actions',
        responseKey: 'action',
      },
    ];
  }
}

const qonosClient = new QonosClient();
export default qonosClient;
