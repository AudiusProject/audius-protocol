import styles from './LoadingSpinner.module.css'

export const LoadingSpinner = () => {
  return (
    <div className={styles.container}>
      <svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='50' cy='50' r='45' style={{ fill: 'transparent' }} />
      </svg>
    </div>
  )
}
