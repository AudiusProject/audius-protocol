import React from 'react'

import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'

import styles from './LoadingSpinner.module.css'

type LoadingSpinnerProps = { className?: string }

const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div className={cn(styles.container, className)}>
      <Lottie
        options={{
          loop: true,
          autoplay: true,
          animationData: loadingSpinner
        }}
      />
    </div>
  )
}

export default LoadingSpinner
