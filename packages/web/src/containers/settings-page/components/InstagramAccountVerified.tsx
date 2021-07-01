import React from 'react'

import InstagramButton from 'components/general/InstagramButton'

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
export const InstagramVerification = (props: InstagramVerificationProps) => {
  return (
    <InstagramButton
      onClick={props.onClick}
      className={styles.button}
      onSuccess={props.onSuccess}
      onFailure={props.onFailure}
      disabled={props.disabled}
      text={messages.verify}
    />
  )
}

export default InstagramVerification
