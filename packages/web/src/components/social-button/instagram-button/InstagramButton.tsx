import { SocialButton, SocialButtonProps } from '@audius/harmony'

export type InstagramButtonProps = Omit<SocialButtonProps, 'socialType'>

export const InstagramButton = (props: InstagramButtonProps) => {
  return <SocialButton socialType='instagram' {...props} />
}
