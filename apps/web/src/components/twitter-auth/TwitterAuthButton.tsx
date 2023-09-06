import {
  TwitterButton,
  TwitterButtonProps
} from 'components/social-button/twitter-button/TwitterButton'

import TwitterAuth, { TwitterAuthProps } from './TwitterAuth'

type TwitterAuthButtonProps = TwitterButtonProps &
  Omit<TwitterAuthProps, 'requestTokenUrl' | 'loginUrl'> & {
    containerClassName?: string
  }

export const TwitterAuthButton = (props: TwitterAuthButtonProps) => {
  const { containerClassName, onFailure, onSuccess, ...buttonProps } = props
  return (
    <TwitterAuth
      className={containerClassName}
      forceLogin
      onFailure={onFailure}
      onSuccess={onSuccess}
    >
      <TwitterButton {...buttonProps} />
    </TwitterAuth>
  )
}
