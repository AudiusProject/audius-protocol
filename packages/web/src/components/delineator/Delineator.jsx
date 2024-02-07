import { IconCaretRight as IconCaret } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './Delineator.module.css'

const Delineator = ({
  className,
  alignment,
  size,
  padTop,
  text,
  isMobile,
  showCarets
}) => {
  return (
    <div
      className={cn(styles.delineator, className, {
        [styles.left]: alignment === 'left',
        [styles.large]: size === 'large',
        [styles.padTop]: padTop,
        [styles.isMobile]: isMobile
      })}
    >
      {alignment === 'center' && <div className={styles.line} />}
      {text && (
        <div className={styles.box}>
          {showCarets && <IconCaret className={styles.caret} />}
          <div className={styles.text}>{text}</div>
          {showCarets && <IconCaret className={styles.caret} />}
        </div>
      )}
      <div className={styles.line} />
    </div>
  )
}

Delineator.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  showCarets: PropTypes.bool,
  alignment: PropTypes.oneOf(['center', 'left']),
  size: PropTypes.oneOf(['small', 'large']),
  padTop: PropTypes.bool,
  isMobile: PropTypes.bool
}

Delineator.defaultProps = {
  showCarets: false,
  alignment: 'center',
  size: 'small'
}

export default Delineator
