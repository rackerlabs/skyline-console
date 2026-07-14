import client from 'client';
import Base from 'stores/base';

export class QonosActionStore extends Base {
  get client() {
    return client.qonos.actions;
  }

  get needGetProject() {
    return false;
  }
}

const globalQonosActionStore = new QonosActionStore();
export default globalQonosActionStore;
