import cn from 'classnames'
import Lottie from 'lottie-react'

import loadingSpinner from 'assets/animations/loadingSpinner.json'

import styles from './LoadingSpinner.module.css'

type LoadingSpinnerProps = { className?: string }

const LoadingSpinner = (props: LoadingSpinnerProps) => {
  const { className } = props

  return (
    <div className={cn(styles.container, className)} role='progressbar'>
      <Lottie loop autoplay animationData={loadingSpinner} />
    </div>
  )
}

export default LoadingSpinner
