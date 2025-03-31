import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Mask.module.css'

const Mask = ({ show = false, zIndex = 1, children }) => {
  return (
    <div className={styles.wrapper}>
      <div
        className={cn(styles.mask, { [styles.show]: show })}
        style={{ zIndex }}
      />
      {children}
    </div>
  )
}

Mask.propTypes = {
  children: PropTypes.node,
  show: PropTypes.bool,
  zIndex: PropTypes.number
}

export default Mask
