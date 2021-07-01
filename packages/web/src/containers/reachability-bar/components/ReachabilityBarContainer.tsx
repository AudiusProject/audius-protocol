import React from 'react'

import { useTransition, animated } from 'react-spring'

import styles from './ReachabilityBarContainer.module.css'

const messages = {
  title: 'No Internet Connection'
}

const ReachabilityBar = () => {
  return <div className={styles.bar}>{messages.title}</div>
}

type ReachabilityBarProps = {
  isReachable: boolean | null
}

const upPosition = {
  transform: 'translate3d(0px, -40px, 0px)'
}

const downPosition = {
  transform: 'translate3d(0px, 0px, 0px)'
}

const ReachabilityBarContainer = ({ isReachable }: ReachabilityBarProps) => {
  const notReachable = isReachable === false // explicitly check bc isReachable can be null
  const transitions = useTransition(notReachable, null, {
    from: upPosition,
    enter: downPosition,
    leave: upPosition
  })

  return (
    <div className={styles.container}>
      {transitions.map(
        ({ item, key, props }) =>
          item && (
            <animated.div key={key} style={props} className={styles.barWrapper}>
              <ReachabilityBar />
            </animated.div>
          )
      )}
    </div>
  )
}

export default ReachabilityBarContainer
