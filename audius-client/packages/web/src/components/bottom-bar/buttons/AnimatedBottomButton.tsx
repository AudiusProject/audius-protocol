import React from 'react'

import AnimatedButtonProvider, {
  AnimatedButtonProviderProps
} from 'components/animated-button/AnimatedButtonProvider'

import styles from './AnimatedBottomButton.module.css'

const AnimatedBottomButton = (props: AnimatedButtonProviderProps) => {
  return (
    <AnimatedButtonProvider
      {...props}
      className={styles.animatedButton}
      activeClassName={styles.activeButton}
      wrapperClassName={styles.iconWrapper}
    />
  )
}

export default AnimatedBottomButton
