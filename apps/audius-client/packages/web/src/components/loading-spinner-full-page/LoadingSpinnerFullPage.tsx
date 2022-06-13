import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './LoadingSpinnerFullPage.module.css'

const LoadingSpinnerFullPage = () => {
  return (
    <div className={styles.container}>
      <LoadingSpinner className={styles.spinner} />
    </div>
  )
}

export default LoadingSpinnerFullPage
