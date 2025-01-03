import cn from 'classnames'
import Lottie from 'lottie-react'

import loadingSpinner from '~harmony/assets/animations/loadingSpinner.json'

import styles from './LoadingSpinner.module.css'

type LoadingSpinnerProps = { className?: string }

const LoadingSpinner = (props: LoadingSpinnerProps) => {
  const { className } = props

  return (
    <div
      className={cn(styles.container, className)}
      role='progressbar'
      data-chromatic='ignore'
    >
      <Lottie loop autoplay animationData={loadingSpinner} />
    </div>
  )
}

export default LoadingSpinner
