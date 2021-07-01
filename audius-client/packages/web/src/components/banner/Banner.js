import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './Banner.module.css'

const Banner = props => {
  return (
    <div
      className={cn(
        styles.banner,
        {
          [styles.isElectron]: props.isElectron,
          [styles.isMobile]: props.isMobile,
          [styles.alert]: props.alert
        },
        props.className
      )}
    >
      <IconRemove className={styles.iconRemove} onClick={props.onClose} />
      {props.children}
    </div>
  )
}

Banner.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func,
  isElectron: PropTypes.bool,
  isMobile: PropTypes.bool,
  alert: PropTypes.bool
}

Banner.defaultProps = {
  alert: false
}

export default Banner
