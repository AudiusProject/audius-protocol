import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from '~harmony/assets/animations/loadingSpinner.json'

import styles from './LoadingSpinner.module.css'

const lottieOptions = {
  loop: true,
  autoplay: true,
  animationData: loadingSpinner
}

type LoadingSpinnerProps = { className?: string }

const LoadingSpinner = (props: LoadingSpinnerProps) => {
  const { className } = props

  return (
    <div
      className={cn(styles.container, className)}
      role='progressbar'
      data-chromatic='ignore'
    >
      <Lottie options={lottieOptions} />
    </div>
  )
}

export default LoadingSpinner
