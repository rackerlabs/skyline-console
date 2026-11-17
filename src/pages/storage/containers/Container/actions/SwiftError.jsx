import React from 'react';
import { Alert } from 'antd';

export const getSwiftErrorFormItem = (body) => ({
  type: 'label',
  display: !!body,
  wrapperCol: { xs: { span: 24 }, sm: { span: 22 } },
  component: (
    <Alert
      type="error"
      showIcon
      message={
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
          }}
        >
          {body}
        </pre>
      }
    />
  ),
});

export default getSwiftErrorFormItem;
