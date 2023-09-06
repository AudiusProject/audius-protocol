import { IconInstagram } from '@audius/stems'

import { SocialButton, SocialButtonProps } from '../SocialButton'

export type InstagramButtonProps = SocialButtonProps

export const InstagramButton = (props: InstagramButtonProps) => {
  return <SocialButton leftIcon={<IconInstagram />} {...props} />
}
