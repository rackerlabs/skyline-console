import moment from 'moment';
import { isArray, isObject } from 'lodash';

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm';

export const DEFAULT_MAX_LEASE_DURATION_SECONDS = 86400;

export const getMaxLeaseDurationSeconds = () =>
  DEFAULT_MAX_LEASE_DURATION_SECONDS;

export const getMaxLeaseDurationHours = () =>
  getMaxLeaseDurationSeconds() / 3600;

export const RESERVATION_TYPES = {
  HOST: 'physical:host',
  FLAVOR_INSTANCE: 'flavor:instance',
  FLOATING_IP: 'virtual:floatingip',
};

export const reservationTypeMap = {
  [RESERVATION_TYPES.HOST]: t('Compute Host'),
  [RESERVATION_TYPES.FLAVOR_INSTANCE]: t('Flavor-based Instance'),
  [RESERVATION_TYPES.FLOATING_IP]: t('Floating IP'),
};

export const reservationTypeOptions = [
  {
    label: reservationTypeMap[RESERVATION_TYPES.HOST],
    value: RESERVATION_TYPES.HOST,
  },
  {
    label: reservationTypeMap[RESERVATION_TYPES.FLAVOR_INSTANCE],
    value: RESERVATION_TYPES.FLAVOR_INSTANCE,
  },
  {
    label: reservationTypeMap[RESERVATION_TYPES.FLOATING_IP],
    value: RESERVATION_TYPES.FLOATING_IP,
  },
];

export const beforeEndOptions = [
  {
    label: t('Default'),
    value: 'default',
  },
];

export const statusMap = {
  PENDING: t('Pending'),
  ACTIVE: t('Active'),
  TERMINATED: t('Terminated'),
  ERROR: t('Error'),
  pending: t('Pending'),
  active: t('Active'),
  terminated: t('Terminated'),
  error: t('Error'),
  UNDONE: t('Undone'),
  DONE: t('Done'),
  IN_PROGRESS: t('In Progress'),
};

export const normalizeReservations = (value) => {
  if (isArray(value)) {
    return value;
  }
  if (isObject(value)) {
    return [value];
  }
  return [];
};

export const formatReservationType = (type) => reservationTypeMap[type] || type;

export const getReservationTypeNames = (reservations = []) =>
  normalizeReservations(reservations)
    .map((it) => formatReservationType(it.resource_type))
    .filter((it) => !!it)
    .join(', ');

export const isActiveStatus = (status) =>
  `${status || ''}`.toLowerCase() === 'active';

export const getUsableLeaseReservations = (lease = {}) => {
  if (!isActiveStatus(lease.status)) {
    return [];
  }
  return normalizeReservations(lease.reservations)
    .filter((reservation) => {
      if (!isActiveStatus(reservation.status)) {
        return false;
      }
      if (reservation.resource_type === RESERVATION_TYPES.HOST) {
        return !!reservation.id;
      }
      if (reservation.resource_type === RESERVATION_TYPES.FLAVOR_INSTANCE) {
        return !!reservation.flavor_id;
      }
      if (reservation.resource_type === RESERVATION_TYPES.FLOATING_IP) {
        return !!reservation.id;
      }
      return false;
    })
    .map((reservation) => ({
      ...reservation,
      lease_id: lease.id,
      lease_name: lease.name,
      lease_status: lease.status,
      start_date: lease.start_date,
      end_date: lease.end_date,
    }));
};

export const getLeaseReservationByTypes = (lease = {}, types = []) => {
  const reservations = getUsableLeaseReservations(lease);
  return reservations.find((reservation) =>
    types.includes(reservation.resource_type)
  );
};

export const getInstanceLeaseReservation = (lease = {}) =>
  getLeaseReservationByTypes(lease, [
    RESERVATION_TYPES.HOST,
    RESERVATION_TYPES.FLAVOR_INSTANCE,
  ]);

export const getFloatingIpLeaseReservation = (lease = {}) =>
  getLeaseReservationByTypes(lease, [RESERVATION_TYPES.FLOATING_IP]);

export const getLeaseInstanceCreatePath = (lease = {}) => {
  const reservation = getInstanceLeaseReservation(lease);
  if (!reservation) {
    return '';
  }
  if (reservation.resource_type === RESERVATION_TYPES.HOST) {
    return `/compute/instance/create?reservation=${reservation.id}`;
  }
  return `/compute/instance/create?flavor=${reservation.flavor_id}`;
};

export const getLeaseFloatingIpPath = (lease = {}) => {
  const reservation = getFloatingIpLeaseReservation(lease);
  if (!reservation) {
    return '';
  }
  const tag = encodeURIComponent(`reservation:${reservation.id}`);
  return `/network/floatingip?tags=${tag}`;
};

export const isBlazarInternalAvailabilityZone = (zoneName) => {
  const name = `${zoneName || ''}`;
  return name === 'freepool' || name.startsWith('blazar_');
};

export const splitTextToArray = (value) =>
  `${value || ''}`
    .split(/[\n,]+/)
    .map((it) => it.trim())
    .filter((it) => !!it);

export const parseKeyValueText = (value) =>
  `${value || ''}`
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => !!it)
    .map((line) => {
      const index = line.indexOf('=');
      if (index < 0) {
        return {
          key: line,
          value: '',
        };
      }
      return {
        key: line.slice(0, index).trim(),
        value: line.slice(index + 1).trim(),
      };
    })
    .filter((it) => !!it.key);

export const buildQueryString = (conditions) => {
  const validConditions = conditions.filter((it) => !!it);
  if (validConditions.length === 0) {
    return '';
  }
  if (validConditions.length === 1) {
    return JSON.stringify(validConditions[0]);
  }
  return JSON.stringify(['and', ...validConditions]);
};

export const formatDate = (value) => {
  if (!value) {
    return undefined;
  }
  if (value === 'now') {
    return value;
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed.utc().format(DATE_FORMAT) : value;
};

export const toMoment = (value) => {
  if (!value) {
    return undefined;
  }
  const parsed = moment.utc(value).local();
  return parsed.isValid() ? parsed : undefined;
};

const range = (start, end) => {
  const result = [];
  for (let i = start; i < end; i += 1) {
    result.push(i);
  }
  return result;
};

const toValidMoment = (value) => {
  if (!value) {
    return null;
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed : null;
};

export const getLaterMoment = (...values) =>
  values
    .filter((it) => !!it)
    .reduce((result, value) => {
      const parsed = toValidMoment(value);
      if (!parsed) {
        return result;
      }
      return !result || parsed.isAfter(result) ? parsed : result;
    }, null);

export const getDisabledDateByRange = (current, minDate, maxDate) => {
  if (!current) {
    return false;
  }
  const value = moment(current);
  const min = toValidMoment(minDate);
  const max = toValidMoment(maxDate);
  if (min && value.isBefore(min, 'day')) {
    return true;
  }
  if (max && value.isAfter(max, 'day')) {
    return true;
  }
  return false;
};

export const getDisabledTimeByRange = (current, minDate, maxDate) => {
  const value = toValidMoment(current);
  if (!value) {
    return {};
  }
  const min = toValidMoment(minDate);
  const max = toValidMoment(maxDate);
  return {
    disabledHours: () => {
      const disabled = [];
      if (min && value.isSame(min, 'day')) {
        disabled.push(...range(0, min.hour()));
      }
      if (max && value.isSame(max, 'day')) {
        disabled.push(...range(max.hour() + 1, 24));
      }
      return Array.from(new Set(disabled));
    },
    disabledMinutes: (selectedHour) => {
      const disabled = [];
      if (min && value.isSame(min, 'day') && selectedHour === min.hour()) {
        disabled.push(...range(0, min.minute()));
      }
      if (max && value.isSame(max, 'day') && selectedHour === max.hour()) {
        disabled.push(...range(max.minute() + 1, 60));
      }
      return Array.from(new Set(disabled));
    },
  };
};

export const getLeaseDurationSeconds = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) {
    return null;
  }
  return end.diff(start, 'seconds', true);
};

export const validateLeaseStartDate = (startDate, allowPast = false) => {
  if (!startDate) {
    return '';
  }
  const start = moment(startDate);
  if (!start.isValid()) {
    return '';
  }
  if (!allowPast && start.isBefore(moment(), 'minute')) {
    return t('Start time must be now or later.');
  }
  return '';
};

export const validateLeaseDuration = (startDate, endDate) => {
  const duration = getLeaseDurationSeconds(startDate, endDate);
  if (duration === null) {
    return '';
  }
  if (duration <= 0) {
    return t('End time must be later than start time.');
  }
  const maxDuration = getMaxLeaseDurationSeconds();
  if (duration > maxDuration) {
    return t(
      'Lease duration cannot exceed {hours} hours ({seconds} seconds).',
      {
        hours: getMaxLeaseDurationHours(),
        seconds: maxDuration,
      }
    );
  }
  return '';
};

export const validateLeaseEndDate = (startDate, endDate, allowPast = false) => {
  if (!endDate) {
    return '';
  }
  const end = moment(endDate);
  if (!end.isValid()) {
    return '';
  }
  if (!allowPast && end.isBefore(moment(), 'minute')) {
    return t('End time must be now or later.');
  }
  return validateLeaseDuration(startDate, endDate);
};

export const validateBeforeEndDate = (
  startDate,
  endDate,
  beforeEndDate,
  allowPast = false
) => {
  if (!beforeEndDate) {
    return '';
  }
  const beforeEnd = moment(beforeEndDate);
  if (!beforeEnd.isValid()) {
    return '';
  }
  if (!allowPast && beforeEnd.isBefore(moment(), 'minute')) {
    return t('Before end time must be now or later.');
  }
  const start = startDate ? moment(startDate) : null;
  const end = endDate ? moment(endDate) : null;
  if (start && start.isValid() && !beforeEnd.isAfter(start)) {
    return t('Before end time must be later than start time.');
  }
  if (end && end.isValid() && !beforeEnd.isBefore(end)) {
    return t('Before end time must be earlier than end time.');
  }
  return '';
};

export const HYPERVISOR_OPERATORS = ['>=', '<=', '='];

const addNumberCondition = (conditions, key, value, operator = '>=') => {
  if ([undefined, null, ''].includes(value)) {
    return;
  }
  const op = HYPERVISOR_OPERATORS.includes(operator) ? operator : '>=';
  conditions.push([op, `$${key}`, `${value}`]);
};

const getHostHypervisorProperties = (reservation) => {
  const conditions = [];
  addNumberCondition(
    conditions,
    'vcpus',
    reservation.vcpus,
    reservation.vcpus_op
  );
  addNumberCondition(
    conditions,
    'memory_mb',
    reservation.memory_mb,
    reservation.memory_mb_op
  );
  addNumberCondition(
    conditions,
    'local_gb',
    reservation.local_gb,
    reservation.local_gb_op
  );
  if (conditions.length === 0 && reservation.hypervisor_properties) {
    return reservation.hypervisor_properties;
  }
  return buildQueryString(conditions);
};
const getHostResourceProperties = (reservation) => {
  const conditions = [];
  const { availability_zone, extra_specs } = reservation;
  if (availability_zone) {
    conditions.push(['=', '$availability_zone', availability_zone]);
  }
  parseKeyValueText(extra_specs).forEach(({ key, value }) => {
    conditions.push(['=', `$${key}`, value]);
  });
  if (conditions.length === 0 && reservation.resource_properties) {
    return reservation.resource_properties;
  }
  return buildQueryString(conditions);
};

export const parseQueryText = (queryText) => {
  if (!queryText) {
    return {};
  }
  try {
    const query = JSON.parse(queryText);
    const conditions =
      isArray(query) && query[0] === 'and' ? query.slice(1) : [query];
    const values = {};
    const extras = [];
    conditions.forEach((condition) => {
      const [op, key, value] = condition || [];
      if (!key) {
        return;
      }
      const cleanKey = key.replace('$', '');
      if (
        ['>=', '<=', '='].includes(op) &&
        ['vcpus', 'memory_mb', 'local_gb'].includes(cleanKey)
      ) {
        values[cleanKey] = Number(value);
        values[`${cleanKey}_op`] = op;
        return;
      }
      if (op === '=' && cleanKey === 'availability_zone') {
        values.availability_zone = value;
        return;
      }
      if (op === '=') {
        extras.push(`${cleanKey}=${value}`);
      }
    });
    return {
      ...values,
      extra_specs: extras.join('\n'),
    };
  } catch (e) {
    return {};
  }
};

export const normalizeReservationForForm = (reservation = {}) => {
  const type = reservation.resource_type || RESERVATION_TYPES.HOST;
  if (type === RESERVATION_TYPES.HOST) {
    return {
      ...reservation,
      min: reservation.min || 1,
      max: reservation.max || reservation.min || 1,
      ...parseQueryText(reservation.hypervisor_properties),
      ...parseQueryText(reservation.resource_properties),
    };
  }
  if (type === RESERVATION_TYPES.FLOATING_IP) {
    return {
      ...reservation,
      amount: reservation.amount || 1,
      required_floatingips_text: normalizeReservations(
        reservation.required_floatingips
      ).join('\n'),
      clear_required_floatingips: false,
    };
  }
  return {
    ...reservation,
    amount: reservation.amount || 1,
  };
};

export const buildHostReservation = (reservation, isEdit = false) => {
  const body = {
    min: Number(reservation.min) || 1,
    max: Number(reservation.max || reservation.min) || 1,
    hypervisor_properties: getHostHypervisorProperties(reservation),
    resource_properties: getHostResourceProperties(reservation),
  };
  if (!isEdit) {
    body.resource_type = RESERVATION_TYPES.HOST;
  }
  if (reservation.id) {
    body.id = reservation.id;
  }
  if (reservation.before_end) {
    body.before_end = reservation.before_end;
  }
  return body;
};

export const buildFlavorReservation = (reservation, isEdit = false) => {
  if (isEdit) {
    return null;
  }
  const body = {
    resource_type: RESERVATION_TYPES.FLAVOR_INSTANCE,
    flavor_id: reservation.flavor_id,
    amount: Number(reservation.amount) || 1,
    affinity: null,
    resource_properties: reservation.resource_properties || '',
  };
  if (reservation.id) {
    body.id = reservation.id;
  }
  return body;
};

export const buildFloatingIpReservation = (reservation, isEdit = false) => {
  const body = {
    amount: Number(reservation.amount) || 1,
  };
  if (!isEdit) {
    body.resource_type = RESERVATION_TYPES.FLOATING_IP;
    body.network_id = reservation.network_id;
  }
  if (reservation.id) {
    body.id = reservation.id;
  }
  const required = splitTextToArray(
    reservation.required_floatingips_text || reservation.required_floatingips
  );
  if (isEdit && reservation.clear_required_floatingips) {
    body.required_floatingips = [];
  } else if (
    !isEdit &&
    (required.length > 0 || reservation.required_floatingips !== undefined)
  ) {
    body.required_floatingips = required;
  }
  return body;
};

export const buildReservationBody = (reservation, isEdit = false) => {
  switch (reservation.resource_type) {
    case RESERVATION_TYPES.HOST:
      return buildHostReservation(reservation, isEdit);
    case RESERVATION_TYPES.FLAVOR_INSTANCE:
      return buildFlavorReservation(reservation, isEdit);
    case RESERVATION_TYPES.FLOATING_IP:
      return buildFloatingIpReservation(reservation, isEdit);
    default:
      return reservation;
  }
};

export const buildLeaseBody = (values, isEdit = false) => {
  const body = {
    name: values.name,
    start_date: formatDate(values.start_date),
    end_date: formatDate(values.end_date),
  };
  if (!isEdit) {
    body.events = [];
  }
  if (values.before_end_date) {
    body.before_end_date = formatDate(values.before_end_date);
  }
  const reservations = normalizeReservations(values.reservations)
    .map((it) => buildReservationBody(it, isEdit))
    .filter((it) => !!it);
  if (!isEdit || reservations.length > 0) {
    body.reservations = reservations;
  }
  return body;
};

export const validateReservations = (reservations = []) => {
  const items = normalizeReservations(reservations);
  if (items.length === 0) {
    return t('Please add at least one reservation.');
  }
  const hasHost = items.some(
    (it) => it.resource_type === RESERVATION_TYPES.HOST
  );
  if (hasHost && items.length > 1) {
    return t(
      'Compute host reservations cannot be mixed with other reservations.'
    );
  }
  const flavorReservation = items.find(
    (it) =>
      it.resource_type === RESERVATION_TYPES.FLAVOR_INSTANCE && !it.flavor_id
  );
  if (flavorReservation) {
    return t('Please select a flavor for each flavor-based reservation.');
  }
  const floatingIpReservation = items.find(
    (it) => it.resource_type === RESERVATION_TYPES.FLOATING_IP && !it.network_id
  );
  if (floatingIpReservation) {
    return t('Please select a network for each floating IP reservation.');
  }
  const invalidHost = items.find((it) => {
    if (it.resource_type !== RESERVATION_TYPES.HOST) {
      return false;
    }
    const min = Number(it.min);
    const max = Number(it.max);
    return !min || !max || min <= 0 || max < min;
  });
  if (invalidHost) {
    return t(
      'Host reservation maximum must be greater than or equal to minimum.'
    );
  }
  return '';
};
