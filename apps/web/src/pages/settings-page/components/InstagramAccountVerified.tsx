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
  /**
   * Whether or not the success of this instagram auth
   * depends on fetching metadata or not.
   * Generally speaking, fetching metadata is not reliable,
   * so if the purpose of this auth is just verification
   * that the user has OAuthed, not to pull specific data,
   * set this flag to false.
   * Without metadata, instagram gives you very few fields:
   * https://developers.facebook.com/docs/instagram-basic-display-api/reference/user
   */
  requiresProfileMetadata?: boolean
}
export const InstagramVerification = ({
  onClick,
  onSuccess,
  onFailure,
  disabled,
  requiresProfileMetadata = true
}: InstagramVerificationProps) => {
  return (
    <InstagramButton
      onClick={onClick}
      className={styles.button}
      onSuccess={onSuccess}
      onFailure={onFailure}
      disabled={disabled}
      text={messages.verify}
      requiresProfileMetadata={requiresProfileMetadata}
    />
  )
}

export default InstagramVerification
