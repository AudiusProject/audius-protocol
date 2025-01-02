import { CSSProperties } from 'react'

import {
  IconValidationCheck,
  IconValidationX,
  IconArrowRight as IconArrow
} from '@audius/harmony'
import { useTransition, animated } from '@react-spring/web'
import cn from 'classnames'

import styles from './StatusMessage.module.css'

type StatusDefaultProps = {
  className: string
}

export const StatusDefault = (props: StatusDefaultProps) => (
  <div className={cn(styles.defaultStatusIcon, props.className)} />
)
export const StatusEmpty = () => (
  <div className={cn(styles.statusIcon, styles.emptyStatusIcon)} />
)

type StatusChangeIconProps = {
  iconStyles: CSSProperties
}

export const StatusError = (props: StatusChangeIconProps) => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.statusIcon, styles.removeIcon)}
  >
    {' '}
    <IconValidationX size='s' />{' '}
  </animated.div>
)
export const StatusSuccess = (props: StatusChangeIconProps) => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.statusIcon, styles.checkIcon)}
  >
    {' '}
    <IconValidationCheck size='s' />
  </animated.div>
)

type StatusMessageProps = {
  status: 'success' | 'error' | 'default'
  containerClassName?: string
  label: string
  labelClassName?: string
  containerStyle?: CSSProperties
  onClick?: () => void
}

export const statusComponents = {
  success: StatusSuccess,
  error: StatusError,
  default: StatusEmpty
}

/** @deprecated Use CompletionChecklistItem instead. */
export const StatusMessage = ({
  status,
  containerClassName,
  label,
  labelClassName,
  containerStyle,
  onClick
}: StatusMessageProps) => {
  const transitions = useTransition(status, {
    from: { x: 0 },
    enter: { x: 1 },
    leave: { x: 0 }
  })

  return (
    <div
      style={containerStyle}
      className={cn(styles.statusContainer, containerClassName, {
        [styles.clickable]: onClick != null
      })}
      onClick={onClick}
    >
      <StatusDefault className={styles.defaultStatusIcon} />
      {transitions((style, status) => {
        if (statusComponents[status]) {
          const StatusIcon = statusComponents[status]
          return (
            <StatusIcon
              iconStyles={{
                opacity: style.x.to({
                  output: [0.3, 1]
                }) as any,
                transform: style.x
                  .to({
                    range: [0, 0.75, 1],
                    output: [0, 1.2, 1]
                  })
                  .to((x) => `scale3d(${x}, ${x}, ${x})`) as any
              }}
            />
          )
        }
        return null
      })}
      <div
        className={cn(styles.label, labelClassName, {
          [styles.errorLabel]: status === 'error'
        })}
      >
        {label}
        {onClick == null ? null : <IconArrow className={styles.iconArrow} />}
      </div>
    </div>
  )
}
