import styles from './DownloadStartingMessage.module.css'

const messages = {
  downloadStarting: 'Your download should begin automatically.',
  didntWork: 'Didn’t work? Try one of the links below!'
}

const DownloadStartingMessage = () => {
  return (
    <div className={styles.container}>
      <p className={styles.downloadStarting}>{messages.downloadStarting}</p>
      <p className={styles.didntWork}>{messages.didntWork}</p>
    </div>
  )
}

export default DownloadStartingMessage
