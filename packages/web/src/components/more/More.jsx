import { Component } from 'react'

import { IconArrowRight as IconArrow } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './More.module.css'

class More extends Component {
  render() {
    const { text, variant, className, onClick } = this.props

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
}

More.propTypes = {
  text: PropTypes.string,
  variant: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
  onClick: PropTypes.func
}

More.defaultProps = {
  text: 'More',
  variant: 'light',
  onClick: () => {}
}

export default More
