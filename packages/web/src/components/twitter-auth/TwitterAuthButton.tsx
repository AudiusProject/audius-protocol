import { SocialButton, SocialButtonProps } from '@audius/harmony'

import { TwitterAuth, TwitterAuthProps } from './TwitterAuth'

type TwitterAuthButtonProps = Omit<
  TwitterAuthProps,
  'requestTokenUrl' | 'loginUrl'
> & {
  containerClassName?: string
} & Omit<SocialButtonProps, 'socialType'>

export const TwitterAuthButton = (props: TwitterAuthButtonProps) => {
  const { containerClassName, onFailure, onSuccess, ...buttonProps } = props
  return (
    <TwitterAuth
      className={containerClassName}
      forceLogin
      onFailure={onFailure}
      onSuccess={onSuccess}
    >
      <SocialButton socialType='twitter' {...buttonProps} />
    </TwitterAuth>
  )
}
