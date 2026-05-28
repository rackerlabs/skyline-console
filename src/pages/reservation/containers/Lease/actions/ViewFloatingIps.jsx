import { getLeaseFloatingIpPath } from 'resources/blazar/reservation';

export default class ViewFloatingIps {
  static id = 'view-reserved-floating-ips';

  static title = t('View Floating IPs');

  static buttonText = t('View Floating IPs');

  static actionType = 'link';

  static policy = 'get_floatingip';

  static allowed = (item) => Promise.resolve(!!getLeaseFloatingIpPath(item));

  static path = (item) => getLeaseFloatingIpPath(item);
}
