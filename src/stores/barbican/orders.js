// Copyright 2024 99cloud
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

import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class OrdersStore extends Base {
  get client() {
    return client.barbican.orders;
  }

  get responseKey() {
    return 'order';
  }

  @action
  async create(data) {
    const { expiration, domain, secret_type, algorithm, bit_length, name } =
      data;

    const body = {
      type: secret_type,
      meta: {
        algorithm,
        bit_length,
        ...(expiration && { expiration }),
        ...(domain && { domain }),
      },
      ...(name && { name }), // Only include name if provided
    };
    return this.client.create(body);
  }
}

const globalOrdersStore = new OrdersStore();
export default globalOrdersStore;
