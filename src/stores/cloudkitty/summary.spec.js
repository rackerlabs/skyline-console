// Copyright 2024 Rackspace
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

import { CloudKittySummaryStore } from './summary';

jest.mock('client', () => ({}));
jest.mock('stores/root', () => ({
  __esModule: true,
  default: { projectId: 'current-project' },
}));
jest.mock('stores/project', () => ({}));

it('reports every day of a leap year with bounded request concurrency', async () => {
  const store = new CloudKittySummaryStore();
  let active = 0;
  let maximum = 0;
  store.fetchSummaryForPeriod = jest.fn(async ({ begin, end }) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await Promise.resolve();
    active -= 1;
    const days = Math.round((end - begin + 1000) / 86400000);
    return { results: [{ type: 'compute', rate: days }] };
  });
  const report = await store.fetchReport({
    begin: new Date('2024-01-01T00:00:00Z'),
    end: new Date('2024-12-31T00:00:00Z'),
  });
  expect(store.fetchSummaryForPeriod).toHaveBeenCalledTimes(367);
  expect(maximum).toBeLessThanOrEqual(7);
  expect(report).toMatchObject({ begin: '2024-01-01', end: '2024-12-31' });
  expect(report.totalCost).toBe(366);
  expect(report.timeline).toHaveLength(366);
  expect(report.timeline[365]).toMatchObject({ date: '2024-12-31', total: 1 });
  expect(report.series.reduce((total, point) => total + point.rate, 0)).toBe(
    report.totalCost
  );
  expect(store.isLoading).toBe(false);
});

it.each([
  ['2025-01-01', '2026-01-02'],
  ['2026-10-21', '2026-10-20'],
  ['invalid', '2026-10-21'],
])(
  'rejects unsupported ranges before querying the API (%s, %s)',
  async (begin, end) => {
    const store = new CloudKittySummaryStore();
    const wasLoading = store.isLoading;
    store.fetchSummaryForPeriod = jest.fn();
    await expect(
      store.fetchReport({ begin: new Date(begin), end: new Date(end) })
    ).rejects.toThrow('reporting range');
    expect(store.fetchSummaryForPeriod).not.toHaveBeenCalled();
    expect(store.isLoading).toBe(wasLoading);
  }
);

it('preserves the previous report and resets loading if a daily request fails', async () => {
  const store = new CloudKittySummaryStore();
  const previous = store.report;
  store.fetchSummaryForPeriod = jest
    .fn()
    .mockResolvedValueOnce({ results: [{ type: 'compute', rate: 1 }] })
    .mockRejectedValueOnce(new Error('Daily request failed'));
  await expect(
    store.fetchReport({
      begin: new Date('2026-10-01T00:00:00Z'),
      end: new Date('2026-10-01T00:00:00Z'),
    })
  ).rejects.toThrow('Daily request failed');
  expect(store.report).toBe(previous);
  expect(store.isLoading).toBe(false);
  store.fetchSummaryForPeriod.mock.calls.forEach(([params]) => {
    expect(params.strict).toBe(true);
  });
});

it('propagates API failures in strict mode while keeping summary fallback', async () => {
  const store = new CloudKittySummaryStore();
  Object.defineProperty(store, 'client', {
    value: { list: jest.fn().mockRejectedValue(new Error('API unavailable')) },
  });
  const params = {
    begin: new Date('2026-10-01T00:00:00Z'),
    end: new Date('2026-10-02T00:00:00Z'),
  };
  await expect(
    store.fetchSummaryForPeriod({ ...params, strict: true })
  ).rejects.toThrow('API unavailable');
  await expect(store.fetchSummaryForPeriod(params)).resolves.toEqual({
    results: [],
    total: 0,
  });
});

const missingEndpoint = () =>
  Object.assign(new Error('Not Found'), { response: { status: 404 } });

const mockApis = (store, v2, v1) => {
  Object.defineProperty(store, 'client', { value: { list: v2 } });
  Object.defineProperty(store, 'legacySummaryClient', { value: { list: v1 } });
};

it.each([false, true])(
  'loads a complete report through v1 after the HAR v2 404 (admin=%s)',
  async (admin) => {
    const store = new CloudKittySummaryStore();
    Object.defineProperty(store, 'hasAdminRole', { value: admin });
    const v2 = jest.fn().mockRejectedValue(missingEndpoint());
    const v1 = jest.fn().mockResolvedValue({
      summary: [{ res_type: 'instance', rate: '12.34567' }],
    });
    mockApis(store, v2, v1);
    const report = await store.fetchReport({
      begin: new Date('2026-10-21T00:00:00Z'),
      end: new Date('2026-10-21T23:59:59Z'),
      scope: admin ? 'all' : 'project',
    });
    expect(v2).toHaveBeenCalledTimes(1);
    expect(v1).toHaveBeenCalledTimes(admin ? 3 : 2);
    expect(v1).toHaveBeenCalledWith({
      begin: '2026-10-21T00:00:00.000Z',
      end: '2026-10-21T23:59:59.000Z',
      groupby: 'res_type',
      tenant_id: admin ? undefined : 'current-project',
      ...(admin ? { all_tenants: true } : {}),
    });
    expect(report.totalCost).toBe(12.34567);
    expect(report.repartition).toEqual([{ type: 'instance', rate: 12.34567 }]);
    expect(report.timeline[0].total).toBe(12.34567);
    expect(store.isLoading).toBe(false);
  }
);

it.each([401, 403, 500])('does not fall back on HTTP %s', async (status) => {
  const store = new CloudKittySummaryStore();
  const error = Object.assign(new Error('API error'), { response: { status } });
  const v1 = jest.fn();
  mockApis(store, jest.fn().mockRejectedValue(error), v1);
  await expect(
    store.fetchReport({
      begin: new Date('2026-10-21'),
      end: new Date('2026-10-21'),
    })
  ).rejects.toBe(error);
  expect(v1).not.toHaveBeenCalled();
});

it('keeps the previous report when both versions are unavailable', async () => {
  const store = new CloudKittySummaryStore();
  const previous = store.report;
  mockApis(
    store,
    jest.fn().mockRejectedValue(missingEndpoint()),
    jest.fn().mockRejectedValue(missingEndpoint())
  );
  await expect(
    store.fetchReport({
      begin: new Date('2026-10-21'),
      end: new Date('2026-10-21'),
    })
  ).rejects.toThrow('Not Found');
  expect(store.report).toBe(previous);
  expect(store.isLoading).toBe(false);
});

it('fetches every v2 page and converts decimal strings before calculating totals', async () => {
  const store = new CloudKittySummaryStore();
  const v2 = jest
    .fn()
    .mockResolvedValueOnce({ total: 2, results: [{ type: 'a', rate: '1.5' }] })
    .mockResolvedValueOnce({ total: 2, results: [{ type: 'b', rate: '2.5' }] });
  const v1 = jest.fn();
  mockApis(store, v2, v1);
  const result = await store.fetchSummaryForPeriod({
    begin: new Date('2026-10-21'),
    end: new Date('2026-10-21'),
    strict: true,
  });
  expect(result.results.map((item) => item.rate)).toEqual([1.5, 2.5]);
  expect(v2.mock.calls.map(([params]) => params.offset)).toEqual([0, 1]);
  expect(v2.mock.calls[0][0].filters).toBe('project_id:current-project');
  expect(v1).not.toHaveBeenCalled();
});

it('keeps an admin token on the selected project in the user panel', async () => {
  const store = new CloudKittySummaryStore();
  Object.defineProperty(store, 'hasAdminRole', { value: true });
  const v2 = jest.fn().mockRejectedValue(missingEndpoint());
  const v1 = jest.fn().mockResolvedValue({
    summary: [{ tenant_id: 'current-project', res_type: 'compute', rate: '4' }],
  });
  mockApis(store, v2, v1);
  const result = await store.fetchSummaryForPeriod({
    begin: new Date('2026-10-21'),
    end: new Date('2026-10-22'),
    groupby: ['type'],
    allowLegacy: true,
    strict: true,
    scope: 'project',
  });
  expect(v2).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: 'project_id:current-project',
    })
  );
  expect(v1).toHaveBeenCalledWith(
    expect.objectContaining({
      tenant_id: 'current-project',
    })
  );
  expect(v1.mock.calls.every(([params]) => !('all_tenants' in params))).toBe(
    true
  );
  expect(result.results[0].rate).toBe(4);
});

it('loads and sorts all-project totals through the supported v1 grouping', async () => {
  const store = new CloudKittySummaryStore();
  const v1 = jest.fn().mockResolvedValue({
    summary: [
      { tenant_id: 'project-a', rate: '2' },
      { tenant_id: 'project-b', rate: '9' },
    ],
  });
  mockApis(store, jest.fn().mockRejectedValue(missingEndpoint()), v1);
  const result = await store.fetchSummaryForPeriod({
    begin: new Date('2026-10-21'),
    end: new Date('2026-10-22'),
    groupby: ['project_id'],
    scope: 'all',
    strict: true,
    allowLegacy: true,
  });
  expect(v1).toHaveBeenCalledWith(
    expect.objectContaining({
      groupby: 'tenant_id',
      all_tenants: true,
      tenant_id: undefined,
    })
  );
  expect(store.getProjectTotals(result.results)).toEqual([
    { project_id: 'project-b', rate: 9 },
    { project_id: 'project-a', rate: 2 },
  ]);
});

it('does not request unscoped costs when the current project is missing', async () => {
  const store = new CloudKittySummaryStore();
  const v2 = jest.fn();
  mockApis(store, v2, jest.fn());
  await expect(
    store.fetchSummaryForPeriod({
      begin: new Date('2026-10-21'),
      end: new Date('2026-10-22'),
      projectId: null,
      strict: true,
    })
  ).rejects.toThrow('Select a project');
  expect(v2).not.toHaveBeenCalled();
});

it.each([
  { summary: 'invalid' },
  { summary: [{ res_type: 'instance', rate: 'invalid' }] },
])(
  'rejects malformed legacy reports rather than enabling CSV',
  async (response) => {
    const store = new CloudKittySummaryStore();
    mockApis(
      store,
      jest.fn().mockRejectedValue(missingEndpoint()),
      jest.fn().mockResolvedValue(response)
    );
    await expect(
      store.fetchReport({
        begin: new Date('2026-10-21'),
        end: new Date('2026-10-21'),
      })
    ).rejects.toThrow('invalid');
  }
);

it('rejects truncated v2 pagination', async () => {
  const store = new CloudKittySummaryStore();
  mockApis(
    store,
    jest.fn().mockResolvedValue({ total: 1, results: [] }),
    jest.fn()
  );
  await expect(
    store.fetchSummaryForPeriod({
      begin: new Date('2026-10-21'),
      end: new Date('2026-10-21'),
      strict: true,
    })
  ).rejects.toThrow('incomplete');
});
