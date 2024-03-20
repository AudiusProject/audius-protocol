import { SocialButton, SocialButtonProps } from '@audius/harmony'

export type TwitterButtonProps = Partial<SocialButtonProps>

export const TwitterButton = (props: TwitterButtonProps) => {
  return <SocialButton socialType='twitter' {...props} />
}
