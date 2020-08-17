import React from 'react'
import PropTypes from 'prop-types'

import Dropdown from 'components/navigation/Dropdown'

import styles from './NavBanner.module.css'
import cn from 'classnames'

const NavBanner = props => {
  const menu = {
    items: [
      {
        text: 'Sort by Recent',
        onClick: props.onSortByRecent
      },
      {
        text: 'Sort by Popular',
        onClick: props.onSortByPopular
      }
    ]
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.background} />
      {!props.empty ? (
        <div
          className={cn(styles.navBanner, {
            overflowVisible: !props.shouldMaskContent
          })}
        >
          <div className={styles.tabs}>{props.tabs}</div>
          <div className={styles.dropdown}>
            {props.dropdownDisabled ? null : (
              <Dropdown
                variant='border'
                menu={menu}
                disabled={props.dropdownDisabled}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

NavBanner.propTypes = {
  tabs: PropTypes.element,
  dropdownDisabled: PropTypes.bool,
  empty: PropTypes.bool,
  onChange: PropTypes.func,
  onSortByRecent: PropTypes.func,
  onSortByPopular: PropTypes.func,
  shouldMaskContent: PropTypes.bool,
  activeTab: PropTypes.string
}

NavBanner.defaultProps = {
  dropdownDisabled: false,
  empty: false,
  onSortByRecent: () => {},
  onSortByPopular: () => {}
}

export default NavBanner
