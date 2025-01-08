import { IconArrowRight as IconArrow } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './More.module.css'

const More = ({
  text = 'More',
  variant = 'light',
  className,
  onClick = () => {}
}) => {
  const color = {
    [styles.light]: variant === 'light',
    [styles.dark]: variant === 'dark'
  }

  return (
    <div className={cn(styles.more, color, className)} onClick={onClick}>
      {text}
      <IconArrow className={styles.iconArrow} />
    </div>
  )
}

More.propTypes = {
  text: PropTypes.string,
  variant: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
  onClick: PropTypes.func
}

export default More
