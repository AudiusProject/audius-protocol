import { SocialButton } from '@audius/harmony'

import { TwitterAuth, TwitterAuthProps } from './TwitterAuth'

type TwitterAuthButtonProps = Omit<
  TwitterAuthProps,
  'requestTokenUrl' | 'loginUrl'
> & {
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
      <SocialButton socialType='twitter' {...buttonProps} />
    </TwitterAuth>
  )
}
