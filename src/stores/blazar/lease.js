import { action } from 'mobx';
import client from 'client';
import Base from 'stores/base';
import {
  getReservationTypeNames,
  normalizeReservations,
} from 'resources/blazar/reservation';

export class LeaseStore extends Base {
  get client() {
    return client.blazar.leases;
  }

  get needGetProject() {
    return false;
  }

  get paramsFunc() {
    return () => ({});
  }

  get mapper() {
    return (data) => {
      const reservations = normalizeReservations(data.reservations);
      const events = normalizeReservations(data.events);
      const reservationStatuses = reservations
        .map((it) => it.status)
        .filter((it) => !!it);
      return {
        ...data,
        reservations,
        events,
        reservation_count: reservations.length,
        event_count: events.length,
        reservation_types: getReservationTypeNames(reservations),
        reservation_statuses: reservationStatuses.join(', '),
      };
    };
  }

  @action
  create(body) {
    return this.submitting(this.client.create(body));
  }

  @action
  edit({ id }, body) {
    return this.submitting(this.client.update(id, body));
  }

  @action
  update({ id }, body) {
    return this.submitting(this.client.update(id, body));
  }
}

const globalLeaseStore = new LeaseStore();
export default globalLeaseStore;
