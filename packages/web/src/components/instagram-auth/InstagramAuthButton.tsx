import {
  InstagramButton,
  InstagramButtonProps
} from 'components/social-button/instagram-button/InstagramButton'

import InstagramAuth, {
  InstagramAuthProps
} from '../instagram-auth/InstagramAuth'

type InstagramAuthButtonProps = Pick<
  InstagramAuthProps,
  'onSuccess' | 'onFailure' | 'disabled'
> &
  InstagramButtonProps & {
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
      <InstagramButton {...buttonProps} />
    </InstagramAuth>
  )
}
