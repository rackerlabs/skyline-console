import { inject, observer } from 'mobx-react';
import { StepAction } from 'containers/Action';
import { blazarEndpoint } from 'client/client/constants';
import globalLeaseStore from 'stores/blazar/lease';
import { buildLeaseBody } from 'resources/blazar/reservation';
import Notify from 'components/Notify';
import BaseStep from './LeaseBaseStep';
import ReservationStep from './LeaseReservationStep';

// Map Blazar error message substrings to user-friendly messages.
const parseBlazarError = (responseData) => {
  const raw =
    (responseData &&
      (responseData.error_message ||
        responseData.message ||
        responseData.faultstring)) ||
    '';
  const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (/not enough hosts/i.test(msg) || /NotEnoughHostsAvailable/i.test(msg)) {
    return t(
      'Not enough hosts available to fulfill this reservation. Try reducing the minimum/maximum host count, relaxing the resource requirements, or choosing a different time window.'
    );
  }
  if (
    /not enough floating/i.test(msg) ||
    /NotEnoughFloatingIPs/i.test(msg) ||
    /floating.*ip.*available/i.test(msg)
  ) {
    return t(
      'Not enough floating IPs available on the selected network. Try reducing the amount or choosing a different network.'
    );
  }
  if (
    /not enough resources/i.test(msg) ||
    /NotEnoughResourcesAvailable/i.test(msg)
  ) {
    return t(
      'Not enough resources available to fulfill this reservation. Try adjusting the resource requirements or time window.'
    );
  }
  if (/overlap/i.test(msg) || /already reserved/i.test(msg)) {
    return t(
      'The requested time window overlaps with an existing reservation. Please choose a different time window.'
    );
  }
  if (/invalid.*date/i.test(msg) || /start.*end/i.test(msg)) {
    return t(
      'Invalid lease dates. Ensure the start time is before the end time and both are in the future.'
    );
  }
  if (/BlazarDBNotFound/i.test(msg) || /database error occurred/i.test(msg)) {
    return t(
      'One or more host capability keys in Extra Specs do not exist in Blazar. An admin must first register the capability on a host with: openstack reservation host set --extra <key>=<value> <hostname>'
    );
  }
  return msg || null;
};

export class Create extends StepAction {
  static id = 'create-lease';

  static title = t('Create Lease');

  static path = '/reservation/lease/create';

  static policy = [
    'osreservations:leases:create',
    'os_compute_api:os-availability-zone:list',
  ];

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalLeaseStore;
  }

  get name() {
    return t('Create lease');
  }

  get listUrl() {
    return this.getRoutePath('lease');
  }

  get successText() {
    return t('Create lease successfully, lease: {name}.', {
      name: this.values.name,
    });
  }

  get errorText() {
    return t('Unable to create lease: {name}.', {
      name: this.values.name,
    });
  }

  get checkEndpoint() {
    return true;
  }

  get endpoint() {
    return blazarEndpoint();
  }

  get hasConfirmStep() {
    return false;
  }

  get steps() {
    return [
      {
        title: t('Base Config'),
        component: BaseStep,
      },
      {
        title: t('Reservation Config'),
        component: ReservationStep,
      },
    ];
  }

  getSubmitData(values) {
    return buildLeaseBody(values);
  }

  onSubmit = (body) => this.store.create(body);

  onOk = () => {
    const { data } = this.state;
    this.values = data;
    const submitData = this.getSubmitData(data);
    this.store.create(submitData).then(
      () => {
        this.routing.push(this.listUrl);
        Notify.success(this.successText);
      },
      (err) => {
        const { response: { data: responseData } = {} } = err || {};
        const parsed = parseBlazarError(responseData);
        if (parsed) {
          Notify.error(this.errorText, parsed);
        } else {
          Notify.errorWithDetail(responseData, this.errorText);
        }
      }
    );
  };
}

export default inject('rootStore')(observer(Create));
