import Button from '../button/Button'

import styles from './Error.module.css'

const messages = {
  somethingWrong: "Ooops! It looks like something's gone wrong...",
  retry: 'Retry'
}

const Error = ({ onRetry, isRetrying }) => {
  return (
    <div className={styles.container}>
      <div className={styles.label}>{messages.somethingWrong}</div>
      <Button
        onClick={onRetry}
        label={messages.retry}
        className={styles.button}
        disabled={isRetrying}
      />
    </div>
  )
}

export default Error
