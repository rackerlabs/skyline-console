import React from 'react';
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalLeaseStore from 'stores/blazar/lease';
import Notify from 'components/Notify';
import {
  buildLeaseBody,
  DATE_FORMAT,
  getDisabledDateByRange,
  getDisabledTimeByRange,
  getLaterMoment,
  getMaxLeaseDurationSeconds,
  normalizeReservationForForm,
  normalizeReservations,
  RESERVATION_TYPES,
  toMoment,
  validateBeforeEndDate,
  validateLeaseEndDate,
  validateLeaseStartDate,
  validateReservations,
} from 'resources/blazar/reservation';
import ReservationInput from './ReservationInput';

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
  return msg || null;
};

export class Edit extends ModalAction {
  static id = 'edit-lease';

  static title = t('Edit Lease');

  static buttonText = t('Edit');

  static policy = [
    'osreservations:leases:update',
    'os_compute_api:os-availability-zone:list',
  ];

  static allowed = (item) => {
    const hasFlavorReservation = normalizeReservations(item.reservations).some(
      (reservation) =>
        reservation.resource_type === RESERVATION_TYPES.FLAVOR_INSTANCE
    );
    return Promise.resolve(!hasFlavorReservation);
  };

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  get name() {
    return t('Edit Lease');
  }

  get beforeEndDate() {
    const { before_end_date, events = [] } = this.item;
    if (before_end_date) {
      return before_end_date;
    }
    const beforeEndEvent = normalizeReservations(events).find((event) =>
      ['before_end_lease', 'before_end'].includes(event.event_type)
    );
    return beforeEndEvent ? beforeEndEvent.time : undefined;
  }

  get defaultValue() {
    const { name, start_date, end_date, reservations = [] } = this.item;
    return {
      name,
      start_date: toMoment(start_date),
      end_date: toMoment(end_date),
      before_end_date: toMoment(this.beforeEndDate),
      reservations: normalizeReservations(reservations).map(
        normalizeReservationForForm
      ),
    };
  }

  get region() {
    return this.currentUser.region || '-';
  }

  get pickerCommonProps() {
    return {
      format: DATE_FORMAT,
      showTime: {
        format: 'HH:mm',
      },
    };
  }

  getFieldValue = (field) => {
    const form = this.getFormInstance();
    return form && form.getFieldValue(field);
  };

  get endMinDate() {
    const start = this.getFieldValue('start_date');
    const startMin = start ? moment(start).add(1, 'minute') : null;
    return getLaterMoment(moment(), startMin);
  }

  get endMaxDate() {
    const start = this.getFieldValue('start_date');
    return start
      ? moment(start).add(getMaxLeaseDurationSeconds(), 'seconds')
      : null;
  }

  get beforeEndMinDate() {
    const start = this.getFieldValue('start_date');
    const startMin = start ? moment(start).add(1, 'minute') : null;
    return getLaterMoment(moment(), startMin);
  }

  get beforeEndMaxDate() {
    const end = this.getFieldValue('end_date');
    return end ? moment(end).subtract(1, 'minute') : null;
  }

  getStartDisabledDate = (current) => getDisabledDateByRange(current, moment());

  getStartDisabledTime = (current) => getDisabledTimeByRange(current, moment());

  getEndDisabledDate = (current) =>
    getDisabledDateByRange(current, this.endMinDate, this.endMaxDate);

  getEndDisabledTime = (current) =>
    getDisabledTimeByRange(current, this.endMinDate, this.endMaxDate);

  getBeforeEndDisabledDate = (current) =>
    getDisabledDateByRange(
      current,
      this.beforeEndMinDate,
      this.beforeEndMaxDate
    );

  getBeforeEndDisabledTime = (current) =>
    getDisabledTimeByRange(
      current,
      this.beforeEndMinDate,
      this.beforeEndMaxDate
    );

  reservationValidator = (rule, value) => {
    const message = validateReservations(value);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  isSameOriginalDate = (value, originalValue) => {
    const original = toMoment(originalValue);
    return original && value && moment(value).isSame(original, 'minute');
  };

  startDateValidator = (rule, value) => {
    const allowPast = this.isSameOriginalDate(value, this.item.start_date);
    const message = validateLeaseStartDate(value, allowPast);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  endDateValidator = (rule, value) => {
    const form = this.getFormInstance();
    const start = form && form.getFieldValue('start_date');
    const allowPast = this.isSameOriginalDate(value, this.item.end_date);
    const message = validateLeaseEndDate(start, value, allowPast);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  beforeEndDateValidator = (rule, value) => {
    const form = this.getFormInstance();
    const start = form && form.getFieldValue('start_date');
    const end = form && form.getFieldValue('end_date');
    const allowPast = this.isSameOriginalDate(value, this.beforeEndDate);
    const message = validateBeforeEndDate(start, end, value, allowPast);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        placeholder: t('Please input name'),
        required: true,
      },
      {
        name: 'region',
        label: t('Region'),
        type: 'label',
        content: this.region,
      },
      {
        name: 'start_date',
        label: t('Start Time'),
        type: 'date-picker',
        ...this.pickerCommonProps,
        disabledDate: this.getStartDisabledDate,
        disabledTime: this.getStartDisabledTime,
        required: true,
        validator: this.startDateValidator,
      },
      {
        name: 'end_date',
        label: t('End Time'),
        type: 'date-picker',
        ...this.pickerCommonProps,
        disabledDate: this.getEndDisabledDate,
        disabledTime: this.getEndDisabledTime,
        required: true,
        dependencies: ['start_date'],
        validator: this.endDateValidator,
      },
      {
        name: 'before_end_date',
        label: t('Before End Time'),
        type: 'date-picker',
        ...this.pickerCommonProps,
        disabledDate: this.getBeforeEndDisabledDate,
        disabledTime: this.getBeforeEndDisabledTime,
        dependencies: ['start_date', 'end_date'],
        validator: this.beforeEndDateValidator,
      },
      {
        name: 'reservations',
        label: t('Reservations'),
        required: true,
        component: <ReservationInput isEdit />,
        validator: this.reservationValidator,
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 20 },
        },
      },
    ];
  }

  getSubmitData(values) {
    return buildLeaseBody(values, true);
  }

  get showNotice() {
    return false;
  }

  onSubmit = (body) =>
    globalLeaseStore.edit({ id: this.item.id }, body).then(
      (res) => {
        Notify.success(this.successText);
        return res;
      },
      (err) => {
        const { response: { data: responseData } = {} } = err || {};
        const parsed = parseBlazarError(responseData);
        if (parsed) {
          Notify.error(this.errorText, parsed);
        } else {
          Notify.errorWithDetail(responseData, this.errorText);
        }
        return Promise.reject(err);
      }
    );
}

export default inject('rootStore')(observer(Edit));
