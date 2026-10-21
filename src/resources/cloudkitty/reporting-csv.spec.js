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

import { buildReportingCsv, reportingCsvFilename } from './reporting-csv';

const report = {
  begin: '2026-10-01',
  end: '2026-10-02',
  totalCost: 12.5,
  repartition: [
    { type: 'compute', rate: 10 },
    { type: 'storage', rate: 2.5 },
  ],
  timeline: [
    { date: '2026-10-01', perType: { compute: 10 }, total: 10 },
    { date: '2026-10-02', perType: { storage: 2.5 }, total: 2.5 },
  ],
};

it('exports readable summary totals, percentages and a daily matrix', () => {
  const csv = buildReportingCsv(report);
  expect(csv.startsWith('\uFEFF"CloudKitty Cost Report"\r\n')).toBe(true);
  expect(csv).toContain('"Period Start (UTC)","2026-10-01"\r\n');
  expect(csv).toContain('"Period End (UTC, inclusive)","2026-10-02"\r\n');
  expect(csv).toContain('"compute",10.00000,80.0\r\n');
  expect(csv).toContain('"storage",2.50000,20.0\r\n');
  expect(csv).toContain('"Total",12.50000,100.0\r\n');
  expect(csv).toContain('"Date (UTC)","compute","storage","Daily Total"\r\n');
  expect(csv).toContain('"2026-10-01",10.00000,0.00000,10.00000\r\n');
  expect(csv).toContain('"2026-10-02",0.00000,2.50000,2.50000\r\n');
  expect(reportingCsvFilename(report)).toBe(
    'cloudkitty-report-2026-10-01-to-2026-10-02.csv'
  );
});

it('escapes quoted and multiline Unicode service names without losing data', () => {
  const csv = buildReportingCsv({
    ...report,
    repartition: [{ type: 'Storage, "雪"\nArchive', rate: 0.00001 }],
    timeline: [],
    totalCost: 0.00001,
  });
  expect(csv).toContain('"Storage, ""雪""\nArchive",0.00001,100.0');
});

it.each(['=HYPERLINK("bad")', '+cmd', '-cmd', '@SUM(A1)', '\t=cmd', '  =cmd'])(
  'protects spreadsheet text cells from formula evaluation: %s',
  (type) => {
    const csv = buildReportingCsv({
      ...report,
      repartition: [{ type, rate: -1 }],
      timeline: [],
      totalCost: -1,
    });
    expect(csv).toContain(`"'${type.replace(/"/g, '""')}",-1.00000,`);
  }
);

it('exports a valid zero report without NaN percentages', () => {
  const csv = buildReportingCsv({ begin: report.begin, end: report.end });
  expect(csv).toContain('"Total",0.00000,\r\n');
  expect(csv).not.toMatch(/NaN|Infinity/);
});

it('includes daily-only service types and negative adjustments as numbers', () => {
  const csv = buildReportingCsv({
    ...report,
    timeline: [{ date: '2026-10-01', perType: { adjustment: -2 }, total: -2 }],
  });
  expect(csv).toContain(
    '"Date (UTC)","compute","storage","adjustment","Daily Total"'
  );
  expect(csv).toContain('"2026-10-01",0.00000,0.00000,-2.00000,-2.00000');
});
