import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import { ReactComponent as IconTwitter } from 'assets/img/iconTwitterBird.svg'

import styles from './TwitterButton.module.css'

const TwitterButton = props => {
  const buttonClassNames = cn(props.className, styles.button, styles.twitter, {
    [styles.verified]: props.textLabel === 'Verified',
    [styles.notVerified]: !props.textLabel === 'Verify',
    [styles.isMobile]: props.isMobile,
    [styles.large]: props.size === 'large',
    [styles.medium]: props.size === 'medium',
    [styles.small]: props.size === 'small',
    [styles.tiny]: props.size === 'tiny'
  })

  return (
    <div onClick={props.onClick} className={cn(buttonClassNames)}>
      <IconTwitter />
      <span className={cn('btnTextLabel', styles.textLabel)}>
        {props.textLabel}
      </span>
    </div>
  )
}

TwitterButton.propTypes = {
  isMobile: PropTypes.bool,
  textLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.oneOf(['tiny', 'small', 'medium', 'large']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool
}

TwitterButton.defaultProps = {
  isMobile: false,
  disabled: false,
  textLabel: 'Button',
  size: 'medium',
  onClick: () => {}
}

export default TwitterButton
