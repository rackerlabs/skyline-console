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

import moment from 'moment';
import {
  getReportRange,
  isValidReportRange,
  reportDate,
  shiftReportRange,
} from './reporting';

const dates = (range) => range.map((date) => date.format('YYYY-MM-DD'));
const now = moment.utc('2026-10-21');

it.each([
  ['day', 1, false, '2026-10-21', '2026-10-21'],
  ['week', 1, false, '2026-10-19', '2026-10-21'],
  ['month', 1, false, '2026-10-01', '2026-10-21'],
  ['year', 1, false, '2026-01-01', '2026-10-21'],
  ['day', 1, true, '2026-10-20', '2026-10-20'],
  ['week', 1, true, '2026-10-12', '2026-10-18'],
  ['month', 1, true, '2026-09-01', '2026-09-30'],
  ['month', 3, true, '2026-07-01', '2026-09-30'],
  ['month', 6, true, '2026-04-01', '2026-09-30'],
  ['year', 1, true, '2025-01-01', '2025-12-31'],
])('calculates %s/%i/previous=%s', (period, amount, previous, start, end) => {
  expect(dates(getReportRange(period, amount, previous, now))).toEqual([
    start,
    end,
  ]);
});

it('handles previous multi-month ranges across the year boundary', () => {
  expect(
    dates(getReportRange('month', 3, true, moment.utc('2026-01-31')))
  ).toEqual(['2025-10-01', '2025-12-31']);
});

it('starts the current week on Monday even on Sunday', () => {
  expect(
    dates(getReportRange('week', 1, false, moment.utc('2026-10-25')))
  ).toEqual(['2026-10-19', '2026-10-25']);
});

it('navigates full calendar months and caps the current month at today', () => {
  const range = getReportRange('month', 1, false, now);
  const previous = shiftReportRange(range, 'month', 1, -1, now);
  expect(dates(previous)).toEqual(['2026-09-01', '2026-09-30']);
  expect(dates(shiftReportRange(previous, 'month', 1, 1, now))).toEqual(
    dates(range)
  );
  expect(shiftReportRange(range, 'month', 1, 1, now)).toBeNull();
});

it('navigates six-month blocks and preserves leap-year boundaries', () => {
  const range = getReportRange('month', 6, true, now);
  expect(dates(shiftReportRange(range, 'month', 6, -1, now))).toEqual([
    '2025-10-01',
    '2026-03-31',
  ]);
  const year = getReportRange('year', 1, true, moment.utc('2025-03-10'));
  expect(dates(year)).toEqual(['2024-01-01', '2024-12-31']);
  expect(isValidReportRange(year, now)).toBe(true);
});

it('preserves the selected calendar date across positive timezone offsets', () => {
  expect(
    reportDate(moment.parseZone('2026-10-21T00:00:00+11:00')).toISOString()
  ).toBe('2026-10-21T00:00:00.000Z');
});

it.each([
  [null, null],
  [moment.invalid(), now],
  [now, now.clone().subtract(1, 'day')],
  [now, now.clone().add(1, 'day')],
  [now.clone().subtract(366, 'days'), now],
])('rejects an invalid or excessive range %#', (start, end) => {
  expect(isValidReportRange([start, end], now)).toBe(false);
});
