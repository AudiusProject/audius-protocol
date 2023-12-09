import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTikTok from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import { Button, type ButtonProps } from 'app/components/core'

type SocialMedia = 'tiktok' | 'instagram' | 'twitter'

// Omitting aria-label from original type purely for showing in Storybook
export type SocialButtonProps = Partial<ButtonProps> & {
  /**
   * Which social media.
   */
  socialType: SocialMedia
  accessibilityLabel?: string
}

const getButtonLogo = (type: SocialMedia) => {
  switch (type) {
    case 'instagram':
      return IconInstagram
    case 'tiktok':
      return IconTikTok
    case 'twitter':
      return IconTwitter
    default:
      return undefined
  }
}

const getSocialButtonProps = (
  type: SocialMedia
): Partial<SocialButtonProps> => {
  switch (type) {
    case 'tiktok':
      return { color: '#fe2c55' }
    case 'twitter':
      return { color: '#1ba1f1' }
    default:
      return {
        // TODO: native-ify this gradient
        //     background: `radial-gradient(61.46% 59.09% at 36.25% 96.55%, #ffd600 0%, #ff6930 48.44%, #fe3b36 73.44%, rgba(254, 59, 54, 0) 100%),
        //   radial-gradient(202.83% 136.37% at 84.5% 113.5%, #ff1b90 24.39%, #f80261 43.67%, #ed00c0 68.85%, #c500e9 77.68%, #7017ff 89.32%)`
        // temp
        color: '#f40281'
      }
  }
}

export const SocialButton = (props: SocialButtonProps) => {
  const { socialType, accessibilityLabel, ...rest } = props
  const socialButtonProps = getSocialButtonProps(socialType)

  return (
    <Button
      {...socialButtonProps}
      {...rest}
      title={accessibilityLabel}
      noText
      icon={getButtonLogo(socialType)}
    />
  )
}
