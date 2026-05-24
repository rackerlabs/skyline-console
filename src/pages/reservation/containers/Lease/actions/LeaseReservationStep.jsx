import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'components/Form';
import {
  RESERVATION_TYPES,
  validateReservations,
} from 'resources/blazar/reservation';
import ReservationInput from './ReservationInput';

export class LeaseReservationStep extends Base {
  get name() {
    return t('Create lease');
  }

  get defaultValue() {
    return {
      reservations: [
        {
          resource_type: RESERVATION_TYPES.HOST,
          min: 1,
          max: 1,
        },
      ],
    };
  }

  reservationValidator = (rule, value) => {
    const message = validateReservations(value);
    if (message) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  };

  get formItems() {
    return [
      {
        name: 'reservations',
        label: t('Reservations'),
        required: true,
        component: <ReservationInput />,
        validator: this.reservationValidator,
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 20 },
        },
      },
    ];
  }
}

export default inject('rootStore')(observer(LeaseReservationStep));
