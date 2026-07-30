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

import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

/**
 * MaintenanceIndicator
 *
 * Displays a red "!" icon next to a resource name when the Nova/Cinder
 * metadata property `rxt-maintenance-notification` is set on that resource.
 *
 * If the metadata is present on the OpenStack asset (instance or volume),
 * display the "!" icon and show its value in the tooltip.
 *
 * Usage:
 *   <MaintenanceIndicator metadata={record.metadata} />
 */
const MaintenanceIndicator = ({ metadata }) => {
  if (!metadata || !metadata['rxt-maintenance-notification']) {
    return null;
  }

  const notificationText = metadata['rxt-maintenance-notification'];

  return (
    <Tooltip title={notificationText} placement="top">
      <ExclamationCircleFilled
        style={{
          color: '#ff4d4f',
          marginLeft: 4,
          fontSize: 14,
          verticalAlign: 'middle',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
};

MaintenanceIndicator.propTypes = {
  metadata: PropTypes.object,
};

MaintenanceIndicator.defaultProps = {
  metadata: null,
};

export default MaintenanceIndicator;
