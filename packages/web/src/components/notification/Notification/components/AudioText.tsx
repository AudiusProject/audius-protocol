import styles from './AudioText.module.css'

const messages = {
  audioLabel: 'audio tokens'
}

type AudioTextProps = {
  value: number
}

export const AudioText = ({ value }: AudioTextProps) => {
  return (
    <span className={styles.root}>
      {value} <span aria-label={messages.audioLabel}>$AUDIO</span>
    </span>
  )
}
