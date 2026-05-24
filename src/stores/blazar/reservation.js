import { get } from 'lodash';
import client from 'client';
import Base from 'stores/base';
import { normalizeReservations } from 'resources/blazar/reservation';

export class ReservationStore extends Base {
  get client() {
    return client.blazar.leases;
  }

  get needGetProject() {
    return false;
  }

  get responseKey() {
    return 'reservation';
  }

  get listResponseKey() {
    return '';
  }

  listFetchByClient(params, originParams) {
    return this.client.show(originParams.id || params.id);
  }

  getListDataFromResult = (result) =>
    normalizeReservations(get(result, 'lease.reservations', []));

  get mapper() {
    return (data, allProjects, originFilters) => ({
      ...data,
      lease_id: data.lease_id || originFilters.id,
    });
  }
}

const globalReservationStore = new ReservationStore();
export default globalReservationStore;
