import { SocialButton, SocialButtonProps } from '@audius/harmony'

export type TikTokButtonProps = Partial<SocialButtonProps>

export const TikTokButton = (props: TikTokButtonProps) => {
  return <SocialButton socialType='tiktok' {...props} />
}
