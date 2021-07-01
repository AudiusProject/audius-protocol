import React from 'react'

import AntTabs from 'antd/lib/tabs'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Tabs.module.css'

const TabPane = AntTabs.TabPane

const Tabs = props => {
  return (
    <AntTabs
      className={cn(styles.tabs, { [styles.noBorder]: !props.border })}
      onChange={props.onChange}
    >
      {props.children.map((pane, i) => (
        <TabPane
          tab={
            <div className={styles.header}>
              <div>{props.headers[i].icon}</div>
              <div>{props.headers[i].text}</div>
            </div>
          }
          key={props.headers[i].text}
        >
          {pane}
        </TabPane>
      ))}
    </AntTabs>
  )
}

Tabs.propTypes = {
  children: PropTypes.node,
  border: PropTypes.bool,
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element,
      text: PropTypes.string
    })
  ),
  onChange: PropTypes.func
}

Tabs.defaultProps = {
  border: true
}

export default Tabs
