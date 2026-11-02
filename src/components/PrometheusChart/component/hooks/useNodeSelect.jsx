import { Select } from 'antd';
import { get } from 'lodash';

import React, { useState } from 'react';

const { Option } = Select;
const useNodeSelect = (defaultNode) => {
  const [node, setNode] = useState(defaultNode);
  const [nodes, setNodes] = useState([]);

  const handleNodeChange = (e) => {
    const key = getKey();
    setNode(nodes.find((i) => i.metric[key] === e));
  };

  const Nodes = () => {
    if (!nodes.length || !node?.metric) {
      return null;
    }
    const key = getKey();
    const current = get(node, `metric.${key}`);
    if (!current) {
      return null;
    }
    return (
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>
          Node:{' '}
        </span>
        <Select
          value={current}
          onChange={handleNodeChange}
          style={{ minWidth: 150 }}
        >
          {nodes.map((item) => (
            <Option key={item.metric[key]} value={item.metric[key]}>
              {item.metric[key]}
            </Option>
          ))}
        </Select>
      </div>
    );
  };

  return [node, Nodes, setNode, setNodes];

  function getKey() {
    if (get(node, 'metric.hostname')) {
      return 'hostname';
    }
    if (get(node, 'metric.mysql_instance_endpoint')) {
      return 'mysql_instance_endpoint';
    }
    if (get(node, 'metric.rabbitmq_node_name')) {
      return 'rabbitmq_node_name';
    }
    return 'instance';
  }
};

export default useNodeSelect;
