import type { CSSObject } from '@emotion/react'

import { IconInstagram, IconTikTok, IconTwitter } from 'icons'

import { Button } from '../Button/Button'
import type { ButtonProps } from '../types'

type SocialMedia = 'tiktok' | 'instagram' | 'twitter'

// Omitting aria-label from original type purely for showing in Storybook
export type SocialButtonProps = Omit<ButtonProps, 'aria-label'> & {
  /**
   * Which social media.
   */
  socialType: SocialMedia
  /**
   * Aria label text. Required since these buttons just have icons
   */
  'aria-label': string
}

const getButtonLogo = (type: SocialMedia) => {
  switch (type) {
    case 'instagram':
      return <IconInstagram size='l' />
    case 'tiktok':
      return <IconTikTok size='l' />
    case 'twitter':
      return <IconTwitter size='l' />
    default:
      return undefined
  }
}

const getSocialButtonProps = (type: SocialMedia): ButtonProps => {
  switch (type) {
    case 'instagram':
      return {}
    case 'tiktok':
      return { hexColor: '#fe2c55' }
    case 'twitter':
      return { hexColor: '#1ba1f1' }
    default:
      return {}
  }
}

export const SocialButton = (props: SocialButtonProps) => {
  const { socialType, ...rest } = props
  const socialButtonProps = getSocialButtonProps(socialType)

  const instagramBackgroundCss: CSSObject = {
    /* Due to the gradient we have to manually apply the same darken calculation that the button uses to each color in the gradient. 
       A bit hacky but this button is a unique edge case */
    background: `radial-gradient(61.46% 59.09% at 36.25% 96.55%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #ffd600) 0%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #ff6930) 48.44%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #fe3b36) 73.44%,
      rgba(254, 59, 54, 0) 100%),
    radial-gradient(202.83% 136.37% at 84.5% 113.5%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #ff1b90) 24.39%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #f80261) 43.67%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #ed00c0) 68.85%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #c500e9) 77.68%,
      color-mix(in srgb, var(--overlay-color) var(--overlay-opacity), #7017ff) 89.32%)`
  }

  return (
    <Button
      {...socialButtonProps}
      {...rest}
      css={({ color }) => ({
        border: 'transparent',
        ...(socialType === 'instagram' && instagramBackgroundCss),

        '& svg path': {
          fill: color.static.white
        }
      })}
    >
      {getButtonLogo(socialType)}
    </Button>
  )
}
