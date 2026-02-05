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

import { isEmpty } from 'lodash';

export const consumerTypes = {
  'front-end': t('Frontend'),
  'back-end': t('Backend'),
  both: t('Both of Frontend and Backend'),
};

export const creationMethod = {
  manu: t('Manu'),
  auto: t('Auto'),
};

export const controls = {
  'front-end': t('Front End'),
  'back-end': t('Back End'),
};

// Default IOPS values for volume types when not available from QoS specs
const defaultIOPSValues = {
  Performance: 10,
  Standard: 5,
  Capacity: 1,
  'HA-Performance': 20,
  'HA-Standard': 10,
};

const getDefaultIOPS = (volumeTypeName) => {
  if (!volumeTypeName) return null;
  return defaultIOPSValues[volumeTypeName] || null;
};

export const getVolumeTypeColumns = (data) => {
  const hasPricing =
    data &&
    data.some((volumeType) => {
      const price = volumeType?.extra_specs?.[':price'];
      return price && !Number.isNaN(parseFloat(price));
    });

  const columns = [
    {
      title: t('Name'),
      dataIndex: 'name',
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      isHideable: true,
      valueRender: 'noValue',
    },
    {
      title: t('Read IOPS/sec per GB'),
      dataIndex: ['qos_props', 'read_iops_sec_per_gb'],
      render: (value, record) => {
        const volumeTypeName = record?.name || '';

        // For HA-Performance and HA-Standard, check expectedIOPSperGiB first
        if (
          volumeTypeName === 'HA-Performance' ||
          volumeTypeName === 'HA-Standard'
        ) {
          const expectedIOPS = record?.qos_props?.expectedIOPSperGiB;
          if (expectedIOPS) return expectedIOPS;
        }

        // Use the specific read_iops_sec_per_gb value if available
        if (value) return value;

        // Fallback to default static values based on volume type name
        const defaultIOPS = getDefaultIOPS(volumeTypeName);
        return defaultIOPS !== null ? defaultIOPS : '-';
      },
    },
    {
      title: t('Write IOPS/sec per GB'),
      dataIndex: ['qos_props', 'write_iops_sec_per_gb'],
      render: (value, record) => {
        const volumeTypeName = record?.name || '';

        // For HA-Performance and HA-Standard, check expectedIOPSperGiB first
        if (
          volumeTypeName === 'HA-Performance' ||
          volumeTypeName === 'HA-Standard'
        ) {
          const expectedIOPS = record?.qos_props?.expectedIOPSperGiB;
          if (expectedIOPS) return expectedIOPS;
        }

        // Use the specific write_iops_sec_per_gb value if available
        if (value) return value;

        // Fallback to default static values based on volume type name
        const defaultIOPS = getDefaultIOPS(volumeTypeName);
        return defaultIOPS !== null ? defaultIOPS : '-';
      },
    },
  ];

  if (hasPricing) {
    columns.push({
      title: t('Cost (/GB/hr)'),
      dataIndex: ['extra_specs', ':price'],
      isHideable: true,
      render: (value) => {
        const num = parseFloat(value);
        if (Number.isNaN(num)) {
          return '-';
        }
        return `$${num.toFixed(6)}`;
      },
    });
  }

  columns.push({
    title: t('Public'),
    dataIndex: 'is_public',
    valueRender: 'yesNo',
  });

  return columns;
};

export const volumeTypeColumns = getVolumeTypeColumns([]);

export const volumeTypeFilters = [
  {
    label: t('Name'),
    name: 'name',
  },
];

export const volumeTypeSelectProps = {
  columns: getVolumeTypeColumns([]),
  filterParams: volumeTypeFilters,
};

export const hasEncryption = (volume) => {
  const { encryption } = volume || {};
  if (!encryption || isEmpty(encryption)) {
    return false;
  }
  return !encryption.deleted_at;
};
