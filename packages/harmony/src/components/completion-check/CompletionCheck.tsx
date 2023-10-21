import type { CSSProperties } from 'react'

import { useTransition, animated } from '@react-spring/web'
import cn from 'classnames'

import { Flex } from '../layout/'

import styles from './CompletionCheck.module.css'
import { IconValidationX, IconValidationCheck } from './icons'
import type { CompletionCheckProps } from './types'

type CompletionDefaultProps = {
  className: string
}

export const CompletionDefault = (props: CompletionDefaultProps) => (
  <div className={cn(styles.defaultCompletionIcon, props.className)} />
)
export const CompletionEmpty = () => (
  <div className={cn(styles.completionIcon, styles.emptyCompletionIcon)} />
)

type CompletionChangeIconProps = {
  iconStyles: CSSProperties
}

export const CompletionError = (props: CompletionChangeIconProps) => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.completionIcon, styles.removeIcon)}
  >
    {' '}
    <IconValidationX />{' '}
  </animated.div>
)
export const CompletionSuccess = (props: CompletionChangeIconProps) => (
  <animated.div
    style={props.iconStyles}
    className={cn(styles.completionIcon, styles.checkIcon)}
  >
    {' '}
    <IconValidationCheck />
  </animated.div>
)

const completionComponents = {
  complete: CompletionSuccess,
  error: CompletionError,
  incomplete: CompletionEmpty
}

export const CompletionCheck = (props: CompletionCheckProps) => {
  const transitions = useTransition(props.value, {
    from: { x: 0 },
    enter: { x: 1 },
    leave: { x: 0 }
  })
  return (
    <Flex alignItems='center' className={styles.container}>
      <CompletionDefault className={styles.defaultCompletionIcon} />
      {transitions((style, value) => {
        if (completionComponents[value]) {
          const CompletionIcon = completionComponents[value]
          return (
            <CompletionIcon
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
    </Flex>
  )
}
