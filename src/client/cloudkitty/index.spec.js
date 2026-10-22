import Axios from 'axios';
import BaseClient from '../client/base';
import client, { CloudKittyClient } from './index';
import { CloudKittyModuleStore } from '../../stores/cloudkitty/module';
import { CloudKittyHashMapServiceStore } from '../../stores/cloudkitty/hashmapService';
import { CloudKittyHashMapFieldStore } from '../../stores/cloudkitty/hashmapField';
import { CloudKittyHashMapMappingStore } from '../../stores/cloudkitty/hashmapMapping';
import { CloudKittyHashMapThresholdStore } from '../../stores/cloudkitty/hashmapThreshold';
import { CloudKittyPyScriptStore } from '../../stores/cloudkitty/pyscript';

jest.mock('client', () => ({
  cloudkitty: require('./index').default,
}));
jest.mock('stores/root', () => ({
  __esModule: true,
  default: {
    user: { project: { id: 'project-1' } },
    endpoints: { cloudkitty: '/api/openstack/regionone/cloudkitty' },
  },
}));
jest.mock('stores/project', () => ({}));

const originalAdapter = Axios.defaults.adapter;
let adapter;

beforeEach(() => {
  adapter = jest.fn(async (config) => {
    // WSME can select XML for Axios's default wildcard Accept header.
    const json = config.headers.Accept === 'application/json';
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': json ? 'application/json' : 'application/xml',
      },
      data: json
        ? JSON.stringify({ modules: [{ module_id: 'hashmap' }] })
        : '<result><modules><item><module_id>hashmap</module_id></item></modules></result>',
    };
  });
  Axios.defaults.adapter = adapter;
});

afterEach(() => {
  Axios.defaults.adapter = originalAdapter;
});

it('reproduces the original empty list when wildcard negotiation selects XML', async () => {
  const response = await new BaseClient().request.get('v1/rating/modules');
  expect(typeof response).toBe('string');
  expect(new CloudKittyModuleStore().getListDataFromResult(response)).toEqual(
    []
  );
});

it('negotiates JSON through the real request layer and populates module rows', async () => {
  const store = new CloudKittyModuleStore();
  await store.fetchList();
  expect(store.list.data).toEqual([
    {
      module_id: 'hashmap',
      id: 'hashmap',
      name: 'hashmap',
      hotConfig: undefined,
    },
  ]);
  expect(adapter.mock.calls[0][0].url).toBe(
    '/api/openstack/regionone/cloudkitty/v1/rating/modules'
  );
});

it.each([
  [CloudKittyModuleStore, 'modules', 'module_id'],
  [CloudKittyHashMapServiceStore, 'services', 'service_id'],
  [CloudKittyHashMapFieldStore, 'fields', 'field_id'],
  [CloudKittyHashMapMappingStore, 'mappings', 'mapping_id'],
  [CloudKittyHashMapThresholdStore, 'thresholds', 'threshold_id'],
  [CloudKittyPyScriptStore, 'scripts', 'script_id'],
])('maps the %p collection to table rows', async (Store, key, idKey) => {
  adapter.mockImplementation(async (config) => ({
    config,
    status: 200,
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({ [key]: [{ [idKey]: 'item-1', name: 'example' }] }),
  }));
  const store = new Store();
  await store.fetchList();
  expect(store.list.data[0].id).toBe('item-1');
  expect(store.list.total).toBe(1);
});

it('preserves query parameters, bodies and caller options on reads and writes', async () => {
  await client.hashmapFields.list(
    { service_id: 'service-1' },
    { timeout: 1234, headers: { 'X-Test': 'preserved' } }
  );
  await client.hashmapServices.create({ name: 'compute' });
  await client.modules.update('hashmap', { priority: 2 });
  await client.pyscripts.delete('script-1');
  await client.summary.list({ groupby: ['type', 'project_id'] });
  const configs = adapter.mock.calls.map(([config]) => config);
  expect(
    configs.every((config) => config.headers.Accept === 'application/json')
  ).toBe(true);
  expect(configs[0].params).toEqual({ service_id: 'service-1' });
  expect(configs[0].timeout).toBe(1234);
  expect(configs[0].headers['X-Test']).toBe('preserved');
  expect(JSON.parse(configs[1].data)).toEqual({ name: 'compute' });
  expect(JSON.parse(configs[2].data)).toEqual({ priority: 2 });
  expect(configs[3].method).toBe('delete');
  expect(configs[4].params.groupby).toEqual(['type', 'project_id']);
});

it('keeps the disabled-service behavior', async () => {
  class DisabledClient extends CloudKittyClient {
    get enable() {
      return false;
    }
  }
  expect(await new DisabledClient().modules.list()).toEqual({});
  expect(adapter).not.toHaveBeenCalled();
});

it.each([
  ['toggle', false, { enabled: false }],
  ['toggle', true, { enabled: true }],
  ['updatePriority', 0, { priority: 0 }],
  ['updatePriority', 5, { priority: 5 }],
])(
  'includes the mandatory body module_id for %s(%p)',
  async (method, value, changes) => {
    adapter.mockImplementation(async (config) => {
      const body = JSON.parse(config.data);
      // CloudKitty v1 validates the body independently of the URL module ID.
      if (!body.module_id) {
        throw new Error('Mandatory field missing: module_id');
      }
      return { config, status: 200, headers: {}, data: '{}' };
    });
    await new CloudKittyModuleStore()[method]({ id: 'noop' }, value);
    const config = adapter.mock.calls[0][0];
    expect(config.method).toBe('put');
    expect(config.url).toBe(
      '/api/openstack/regionone/cloudkitty/v1/rating/modules/noop'
    );
    expect(config.headers.Accept).toBe('application/json');
    expect(JSON.parse(config.data)).toEqual({ module_id: 'noop', ...changes });
  }
);

it('rejects XML instead of silently displaying an empty table', async () => {
  adapter.mockImplementation(async (config) => ({
    config,
    status: 200,
    headers: { 'content-type': 'application/xml' },
    data: '<result><modules /></result>',
  }));
  await expect(new CloudKittyModuleStore().fetchList()).rejects.toThrow(
    'CloudKitty returned a non-JSON response'
  );
});

it('requests the v1 report summary as JSON with legacy grouping', async () => {
  await client.legacySummary.list({ groupby: 'res_type', all_tenants: false });
  const config = adapter.mock.calls[0][0];
  expect(config.url).toBe(
    '/api/openstack/regionone/cloudkitty/v1/report/summary'
  );
  expect(config.headers.Accept).toBe('application/json');
  expect(config.params).toEqual({ groupby: 'res_type', all_tenants: false });
});
