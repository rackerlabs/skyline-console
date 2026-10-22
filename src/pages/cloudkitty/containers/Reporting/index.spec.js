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

import FileSaver from 'file-saver';
import Notify from 'components/Notify';
import { getReportRange } from 'resources/cloudkitty/reporting';
import { Reporting } from './index';

jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
jest.mock('bizcharts', () => ({}));
jest.mock('antd', () => ({ DatePicker: {} }));
jest.mock('@ant-design/icons', () => ({}));
jest.mock('resources/cloudkitty/rating', () => ({ formatRate: String }));
jest.mock('components/Notify', () => ({ error: jest.fn() }));
jest.mock('components/Cards/NotFound', () => () => null);
jest.mock('resources/skyline/policy', () => () => true);
jest.mock('client/client/constants', () => ({
  cloudkittyEndpoint: () => '/api',
}));
jest.mock('stores/cloudkitty/summary', () => ({
  __esModule: true,
  default: {},
}));

const createPanel = () => {
  const panel = new Reporting({});
  panel.state = {
    ...panel.state,
    range: getReportRange('month'),
    reportReady: true,
  };
  panel.store = {
    isLoading: false,
    currentProjectId: 'current-project',
    reportScope: 'project:current-project',
    report: {
      begin: panel.state.range[0].format('YYYY-MM-DD'),
      end: panel.state.range[1].format('YYYY-MM-DD'),
      totalCost: 0,
      repartition: [],
      timeline: [],
    },
  };
  panel.setState = (state) => {
    panel.state = { ...panel.state, ...state };
  };
  return panel;
};

beforeEach(() => {
  jest.clearAllMocks();
  global.t = (value) => value;
});

it('downloads the loaded report with its applied period in the filename', () => {
  const panel = createPanel();
  const { begin, end } = panel.store.report;
  panel.onExport();
  expect(FileSaver.saveAs).toHaveBeenCalledWith(
    expect.any(Blob),
    `cloudkitty-report-${begin}-to-${end}.csv`
  );
  expect(FileSaver.saveAs.mock.calls[0][0].type).toBe('text/csv;charset=utf-8');
});

it('blocks exports during loading and after unapplied date changes', () => {
  const panel = createPanel();
  panel.store.isLoading = true;
  panel.onExport();
  panel.store.isLoading = false;
  panel.onRangeChange([
    panel.state.range[0].clone().subtract(1, 'day'),
    panel.state.range[1],
  ]);
  panel.onExport();
  expect(FileSaver.saveAs).not.toHaveBeenCalled();
});

it('blocks stale exports after a failed refresh and displays an error', async () => {
  const panel = createPanel();
  panel.store.fetchReport = jest
    .fn()
    .mockRejectedValue(new Error('API failed'));
  await panel.fetchReport();
  panel.onExport();
  expect(FileSaver.saveAs).not.toHaveBeenCalled();
  expect(Notify.error).toHaveBeenCalled();
});

it('enables export only after the entire report finishes loading', async () => {
  const panel = createPanel();
  let finish;
  panel.store.fetchReport = jest.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const request = panel.fetchReport();
  expect(panel.canExport).toBe(false);
  finish();
  await request;
  expect(panel.canExport).toBe(true);
});

it('reloads costs for a newly selected project and uses all-project scope in admin', async () => {
  const panel = createPanel();
  panel.props = { location: { pathname: '/cloudkitty/reporting' } };
  panel.store.fetchReport = jest.fn().mockResolvedValue({});

  panel.componentDidMount();
  expect(panel.store.fetchReport).toHaveBeenLastCalledWith(
    expect.objectContaining({ scope: 'project', projectId: 'current-project' })
  );

  panel.store.currentProjectId = 'other-project';
  panel.componentDidUpdate();
  expect(panel.store.fetchReport).toHaveBeenLastCalledWith(
    expect.objectContaining({ scope: 'project', projectId: 'other-project' })
  );
  expect(panel.report).toEqual({});

  panel.props = { location: { pathname: '/cloudkitty-admin/reporting' } };
  panel.componentDidUpdate();
  expect(panel.store.fetchReport).toHaveBeenLastCalledWith(
    expect.objectContaining({ scope: 'all' })
  );
});
