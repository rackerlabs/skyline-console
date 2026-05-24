import Base from '../client/base';
import { blazarBase } from '../client/constants';

export class BlazarClient extends Base {
  get baseUrl() {
    return blazarBase();
  }

  get resources() {
    return [
      {
        key: 'leases',
        responseKey: 'lease',
      },
      {
        name: 'hosts',
        key: 'os-hosts',
        responseKey: 'host',
      },
      {
        key: 'floatingips',
        responseKey: 'floatingip',
      },
    ];
  }
}

const blazarClient = new BlazarClient();
export default blazarClient;
