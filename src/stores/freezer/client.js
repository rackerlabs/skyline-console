import client from 'client';
import Base from 'stores/base';

export class FreezerClientStore extends Base {
  get client() {
    return client.freezer.clients;
  }

  get listResponseKey() {
    return 'clients';
  }

  // freezer-api returns only 10 items by default; request all explicitly.
  listFetchByClient(params, originParams) {
    return super.listFetchByClient({ limit: 500, ...params }, originParams);
  }

  get mapper() {
    return (data) => ({
      ...data,
      id: data.client?.client_id || data.uuid,
      client_id: data.client?.client_id,
      hostname: data.client?.hostname,
      uuid: data.uuid || data.client?.uuid,
      name: data.client?.hostname || data.client?.client_id,
    });
  }
}

const globalFreezerClientStore = new FreezerClientStore();
export default globalFreezerClientStore;
