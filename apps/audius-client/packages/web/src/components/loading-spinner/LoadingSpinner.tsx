import React from 'react'
import Lottie from 'react-lottie'
import styles from './LoadingSpinner.module.css'
import loadingSpinner from 'assets/animations/loadingSpinner.json'
import cn from 'classnames'

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
