import { getLeaseInstanceCreatePath } from 'resources/blazar/reservation';

export default class UseInstance {
  static id = 'use-instance-reservation';

  static title = t('Create Instance');

  static buttonText = t('Create Instance');

  static actionType = 'link';

  static policy = 'os_compute_api:servers:create';

  static allowed = (item) =>
    Promise.resolve(!!getLeaseInstanceCreatePath(item));

  static path = (item) => getLeaseInstanceCreatePath(item);
}
