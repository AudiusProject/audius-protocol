import { SocialButton, SocialButtonProps } from '@audius/harmony'

import InstagramAuth, {
  InstagramAuthProps
} from '../instagram-auth/InstagramAuth'

type InstagramAuthButtonProps = Pick<
  InstagramAuthProps,
  'onSuccess' | 'onFailure' | 'disabled'
> &
  Omit<SocialButtonProps, 'socialType'> & {
    containerClassName?: string
  }

export const InstagramAuthButton = (props: InstagramAuthButtonProps) => {
  const {
    containerClassName,
    onSuccess,
    onFailure,
    disabled = false,
    ...buttonProps
  } = props

  return (
    <InstagramAuth
      className={containerClassName}
      disabled={disabled}
      onFailure={onFailure}
      onSuccess={onSuccess}
    >
      <SocialButton socialType='instagram' {...buttonProps} />
    </InstagramAuth>
  )
}
