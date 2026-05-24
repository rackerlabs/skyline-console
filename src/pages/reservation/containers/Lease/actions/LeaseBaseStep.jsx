import moment from 'moment';
import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import {
  DATE_FORMAT,
  getDisabledDateByRange,
  getDisabledTimeByRange,
  getLaterMoment,
  getMaxLeaseDurationSeconds,
  validateBeforeEndDate,
  validateLeaseEndDate,
  validateLeaseStartDate,
} from 'resources/blazar/reservation';

export class LeaseBaseStep extends Base {
  get name() {
    return t('Create lease');
  }

  get defaultValue() {
    return {
      start_date: moment().add(1, 'hours'),
      end_date: moment().add(2, 'hours'),
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

  startDateValidator = (rule, value) => {
    const message = validateLeaseStartDate(value);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  endDateValidator = (rule, value) => {
    const form = this.getFormInstance();
    const start = form && form.getFieldValue('start_date');
    const message = validateLeaseEndDate(start, value);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  beforeEndDateValidator = (rule, value) => {
    const form = this.getFormInstance();
    const start = form && form.getFieldValue('start_date');
    const end = form && form.getFieldValue('end_date');
    const message = validateBeforeEndDate(start, end, value);
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
    ];
  }
}

export default inject('rootStore')(observer(LeaseBaseStep));
