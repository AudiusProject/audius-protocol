import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

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
    <div className={cn(buttonClassNames)}>
      <IconTwitter
        className={cn({ [props.iconClassName]: !!props.iconClassName })}
      />
      <span
        className={cn('btnTextLabel', styles.textLabel, {
          [props.textClassName]: !!props.textClassName
        })}
      >
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
  disabled: PropTypes.bool,
  textClassName: PropTypes.string,
  iconClassName: PropTypes.string
}

TwitterButton.defaultProps = {
  isMobile: false,
  disabled: false,
  textLabel: 'Button',
  size: 'medium',
  onClick: () => {}
}

export default TwitterButton
