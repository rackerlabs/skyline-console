import { inject, observer } from 'mobx-react';
import { StepAction } from 'containers/Action';
import globalScheduleStore from 'stores/qonos/schedule';
import { buildScheduleBody, getScheduleCreatePath } from 'resources/qonos';
import BaseStep from './BaseStep';
import TargetStep from './TargetStep';
import ScheduleStep from './ScheduleStep';

export class Create extends StepAction {
  static id = 'create-qonos-schedule';

  static title = t('Create Schedule');

  static actionType = 'link';

  static buttonType = 'primary';

  static path = (_, containerProps) =>
    getScheduleCreatePath(containerProps?.isAdminPage);

  static policy = '';

  static aliasPolicy = 'qonos:schedules:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalScheduleStore;
  }

  get listUrl() {
    return this.getRoutePath('qonosSchedule');
  }

  get name() {
    return t('Create schedule');
  }

  get hasConfirmStep() {
    return false;
  }

  get successText() {
    return t('Create schedule successfully.');
  }

  get errorText() {
    return t('Unable to create schedule.');
  }

  get steps() {
    return [
      { title: t('Base Config'), component: BaseStep },
      { title: t('Target Config'), component: TargetStep },
      { title: t('Schedule Config'), component: ScheduleStep },
    ];
  }

  getSubmitData(data) {
    return buildScheduleBody(data);
  }

  onSubmit = (body) => this.store.create(body);
}

export default inject('rootStore')(observer(Create));
