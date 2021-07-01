import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconTrophy } from 'assets/img/iconTrophy.svg'

import styles from './Badge.module.css'

const Badge = ({ textLabel, className }) => (
  <div className={cn(className, styles.badge)}>
    <span className={styles.badgeIcon}>
      <IconTrophy />
    </span>
    <span className={styles.badgeTextLabel}>{textLabel}</span>
  </div>
)

Badge.propTypes = {
  textLabel: PropTypes.string,
  className: PropTypes.string
}

Badge.defaultProps = {
  textLabel: '#1 All Time'
}

export default React.memo(Badge)
