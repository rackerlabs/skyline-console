import { get } from 'lodash';
import client from 'client';
import Base from 'stores/base';
import { normalizeReservations } from 'resources/blazar/reservation';

export class EventStore extends Base {
  get client() {
    return client.blazar.leases;
  }

  get needGetProject() {
    return false;
  }

  get responseKey() {
    return 'event';
  }

  get listResponseKey() {
    return '';
  }

  listFetchByClient(params, originParams) {
    return this.client.show(originParams.id || params.id);
  }

  getListDataFromResult = (result) =>
    normalizeReservations(get(result, 'lease.events', []));

  get mapper() {
    return (data, allProjects, originFilters) => ({
      ...data,
      lease_id: data.lease_id || originFilters.id,
    });
  }
}

const globalEventStore = new EventStore();
export default globalEventStore;
