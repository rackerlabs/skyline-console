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
import { getSwiftStorageWarnings } from 'resources/swift/container';

const SwiftStorageWarning = ({ container, isFreezerContainer }) => {
  const warnings = getSwiftStorageWarnings(container, {
    isFreezerContainer,
  });
  if (!warnings.length) {
    return null;
  }
  const warning = warnings.join(' ');
  return (
    <Tooltip
      title={warning}
      color="#A33E3E"
      placement="right"
      trigger={['hover', 'focus']}
    >
      <button
        type="button"
        title=""
        aria-label={warning}
        style={{
          border: 0,
          background: 'transparent',
          padding: 0,
          cursor: 'help',
          flexShrink: 0,
        }}
      >
        <ExclamationCircleFilled
          style={{ color: '#ff4d4f', marginLeft: 4, fontSize: 14 }}
        />
      </button>
    </Tooltip>
  );
};

SwiftStorageWarning.propTypes = {
  container: PropTypes.string,
  isFreezerContainer: PropTypes.bool,
};

SwiftStorageWarning.defaultProps = {
  container: '',
  isFreezerContainer: false,
};

export default SwiftStorageWarning;
