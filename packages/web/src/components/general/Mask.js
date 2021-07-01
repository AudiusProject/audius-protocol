import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Mask.module.css'

const Mask = props => {
  return (
    <div className={styles.wrapper}>
      <div
        className={cn(styles.mask, { [styles.show]: props.show })}
        style={{ zIndex: props.zIndex }}
      />
      {props.children}
    </div>
  )
}

Mask.propTypes = {
  children: PropTypes.node,
  show: PropTypes.bool,
  zIndex: PropTypes.number
}

Mask.defaultProps = {
  show: false,
  zIndex: 1
}

export default Mask
