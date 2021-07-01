import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import { animated, useTransition } from 'react-spring'

import { ReactComponent as IconArrow } from 'assets/img/iconArrow.svg'
import { ReactComponent as IconValidationCheck } from 'assets/img/iconValidationCheck.svg'
import { ReactComponent as IconValidationX } from 'assets/img/iconValidationX.svg'

import styles from './StatusMessage.module.css'

export const StatusDefault = props => (
  <div
    className={cn(styles.defaultStatusIcon, {
      [props.containerStyles]: !!props.containerStyles
    })}
  />
)
export const StatusEmpty = props => (
  <div
    className={cn(styles.statusIcon, styles.emptyStatusIcon, {
      [props.containerStyles]: !!props.containerStyles
    })}
  />
)
export const StatusError = props => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.statusIcon, styles.removeIcon, {
      [props.containerStyles]: !!props.containerStyles
    })}
  >
    {' '}
    <IconValidationX />{' '}
  </animated.div>
)
export const StatusSuccess = props => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.statusIcon, styles.checkIcon, {
      [props.containerStyles]: !!props.containerStyles
    })}
  >
    {' '}
    <IconValidationCheck />
  </animated.div>
)

export const status = {
  success: StatusSuccess,
  error: StatusError,
  default: StatusEmpty
}

export const StatusMessage = props => {
  const transitions = useTransition(status[props.status], props.status, {
    from: { x: 0 },
    enter: { x: 1 },
    leave: { x: 0 }
  })

  return (
    <div
      style={props.containerStyle || {}}
      className={cn(styles.statusContainer, {
        [props.containerClassName]: !!props.containerClassName,
        [styles.clickable]: props.isClickable
      })}
      onClick={props.onClick}
    >
      <StatusDefault containerStyles={cn(styles.defaultStatusIcon)} />
      {transitions.map(
        ({ item: StatusIcon, props: animateProps, key }) =>
          StatusIcon && (
            <StatusIcon
              key={key}
              iconStyles={{
                opacity: animateProps.x.interpolate({ output: [0.3, 1] }),
                transform: animateProps.x
                  .interpolate({
                    range: [0, 0.75, 1],
                    output: [0, 1.2, 1]
                  })
                  .interpolate(x => `scale3d(${x}, ${x}, ${x})`)
              }}
              containerStyles={cn(props.statusWrapperStyles)}
            />
          )
      )}
      <div
        className={cn(styles.label, {
          [styles.errorLabel]: props.status === 'error',
          [props.labelClassName]: !!props.labelClassName
        })}
      >
        {props.label}
        {props.isClickable && <IconArrow className={styles.iconArrow} />}
      </div>
    </div>
  )
}

StatusMessage.propTypes = {
  status: PropTypes.oneOf(['success', 'error', 'default']),
  containerClassName: PropTypes.string,
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  containerStyle: PropTypes.object,
  onClick: PropTypes.func,
  isClickable: PropTypes.bool
}

export default StatusMessage
