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

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { navItemPropType, getFirstLevelNavItemLink } from '../common';
// import { pickFixedParams } from 'utils';
import styles from './index.less';

export default class Left extends React.Component {
  static propTypes = {
    items: PropTypes.oneOfType([
      PropTypes.arrayOf(navItemPropType),
      PropTypes.array,
    ]),
    onClose: PropTypes.func,
  };

  static defaultProps = {
    items: [],
  };

  renderItem = (item, index) => {
    const { onClose } = this.props;
    const key = item.path || item.name || item.key || index;

    if (item.externalUrl) {
      return (
        <div className={styles.item} key={key}>
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={styles['item-label']}
          >
            {item.name}
          </a>
        </div>
      );
    }

    const linkTo = getFirstLevelNavItemLink(item);
    return (
      <div className={styles.item} key={key}>
        <Link onClick={onClose} to={linkTo} className={styles['item-label']}>
          {item.name}
        </Link>
      </div>
    );
  };

  render() {
    const { items } = this.props;
    return (
      <div id="global-nav-left" className={styles.left}>
        {items.map((item, index) => this.renderItem(item, index))}
      </div>
    );
  }
}
