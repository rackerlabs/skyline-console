import React from 'react';
import PropTypes from 'prop-types';
import { AutoComplete, Input } from 'antd';

export default function TrustIdInput({
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <AutoComplete
      value={value}
      options={options}
      onChange={onChange}
      filterOption={(inputValue, option) =>
        (option.value || '').toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.label || '').toLowerCase().includes(inputValue.toLowerCase())
      }
    >
      <Input placeholder={placeholder} />
    </AutoComplete>
  );
}

TrustIdInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array,
  placeholder: PropTypes.string,
};

TrustIdInput.defaultProps = {
  value: undefined,
  onChange: undefined,
  options: [],
  placeholder: '',
};
