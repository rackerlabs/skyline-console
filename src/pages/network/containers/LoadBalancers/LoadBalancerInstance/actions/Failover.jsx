import React from 'react';
import { ConfirmAction } from 'containers/Action';
import { allCanChangePolicy } from 'resources/skyline/policy';
import globalLbaasStore from 'stores/octavia/loadbalancer';

export default class FailoverAction extends ConfirmAction {
  get id() {
    return 'failover';
  }

  get title() {
    return t('Failover Load Balancer');
  }

  get buttonText() {
    return t('Failover');
  }

  get actionName() {
    return t('failover load balancer');
  }

  get isDanger() {
    return true;
  }

  get isAsyncAction() {
    return true;
  }

  policy = allCanChangePolicy;

  confirmContext = (data) => {
    const name = this.getName(data);
    const question = t('Are you sure to {action} (instance: {name})?', {
      action: this.actionNameDisplay || this.title,
      name,
    });
    const warning = t(
      "This operation replaces the underlying virtual devices. The load balancer's configuration and IP address are retained, but active connections may be dropped and a brief service interruption can occur."
    );
    return (
      <div>
        <p>{question}</p>
        <p>{warning}</p>
      </div>
    );
  };

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return (
      item.provider !== 'ovn' &&
      ['ACTIVE', 'ERROR'].includes(item.provisioning_status)
    );
  };

  onSubmit = (data) => globalLbaasStore.failover(data);
}
