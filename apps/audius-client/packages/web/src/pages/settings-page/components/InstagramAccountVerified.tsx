import InstagramButton from 'components/instagram-button/InstagramButton'

import styles from './InstagramAccountVerified.module.css'

const messages = {
  verify: 'Verify with Instagram'
}

type InstagramVerificationProps = {
  onClick: () => void
  onSuccess: (uuid: string, profile: any) => void
  onFailure: (error: any) => void
  disabled?: boolean
  text?: string
}
export const InstagramVerification = ({
  onClick,
  onSuccess,
  onFailure,
  disabled
}: InstagramVerificationProps) => {
  return (
    <InstagramButton
      onClick={onClick}
      className={styles.button}
      onSuccess={onSuccess}
      onFailure={onFailure}
      disabled={disabled}
      text={messages.verify}
    />
  )
}

export default InstagramVerification
