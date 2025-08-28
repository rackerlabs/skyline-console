// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import globalLoadBalancerProviderStore from 'stores/octavia/providers';

export const BackendProtocol = [
  {
    label: t('TCP'),
    value: 'TCP',
  },
  {
    label: t('PING'),
    value: 'PING',
  },
];

export const lbAlgorithmOptionsOvn = [
  { label: t('ROUND_ROBIN'), value: 'ROUND_ROBIN' },
  { label: t('LEAST_CONNECTIONS'), value: 'LEAST_CONNECTIONS' },
  { label: t('SOURCE_IP'), value: 'SOURCE_IP' },
  { label: t('SOURCE_IP_PORT'), value: 'SOURCE_IP_PORT' },
];

export const algorithmDict = {
  LEAST_CONNECTIONS: t('LEAST_CONNECTIONS'),
  ROUND_ROBIN: t('ROUND_ROBIN'),
  SOURCE_IP: t('SOURCE_IP'),
};

export const algorithmTip = {
  LEAST_CONNECTIONS: t(
    'A dynamic scheduling algorithm that estimates the server load based on the number of currently active connections. The system allocates new connection requests to the server with the least number of current connections. Commonly used for long connection services, such as database connections and other services.'
  ),
  ROUND_ROBIN: t(
    'Each new connection request is assigned to the next server in order, and all requests are finally divided equally among all servers. Commonly used for short connection services, such as HTTP services.'
  ),
  SOURCE_IP: t(
    'Perform a consistent hash operation on the source IP address of the request to obtain a specific value. At the same time, the back-end server is numbered, and the request is distributed to the server with the corresponding number according to the calculation result. This can enable load distribution of visits from different source IPs, and at the same time enable requests from the same client IP to always be dispatched to a specific server. This method is suitable for load balancing TCP protocol without cookie function.'
  ),
  SOURCE_IP_PORT: t(
    'Requests from the same source IP and port are sent to the same member (OVN only).'
  ),
};

export const Algorithm = Object.keys(algorithmDict).map((key) => ({
  label: algorithmDict[key],
  value: key,
}));

// Cache so we only fetch providers once per page load
let _lbAlgorithmOptionsPromise = null;

export const getLbAlgorithmOptions = () => {
  if (_lbAlgorithmOptionsPromise) {
    return _lbAlgorithmOptionsPromise;
  }

  _lbAlgorithmOptionsPromise = (async () => {
    const defaults = [...Algorithm];

    try {
      const providers =
        await globalLoadBalancerProviderStore.listFetchByClient();
      console.log('providers: ', providers);
      const providerNames = providers.providers.map(
        (p) => p.name && p.name.toLowerCase()
      );
      console.log('getLbAlgorithmOptions: providerNames: ', providerNames);
      if (providerNames.includes('ovn')) {
        return [
          ...defaults,
          { label: 'SOURCE_IP_PORT', value: 'SOURCE_IP_PORT' },
        ];
      }
    } catch (err) {
      console.warn('Failed to fetch load balancer providers:', err);
    }
    return defaults;
  })();

  return _lbAlgorithmOptionsPromise;
};
