import cn from 'classnames'

import { IconInstagram, IconTikTok, IconTwitter } from 'components/icon'

import { Button } from '../Button/Button'
import type { ButtonProps } from '../types'

import styles from './SocialButton.module.css'

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
      return <IconInstagram size='large' />
    case 'tiktok':
      return <IconTikTok size='large' />
    case 'twitter':
      return <IconTwitter size='large' />
    default:
      return undefined
  }
}

const getSocialButtonProps = (type: SocialMedia): ButtonProps => {
  switch (type) {
    case 'instagram':
      return { className: styles.instagram }
    case 'tiktok':
      return { hexColor: '#fe2c55' }
    case 'twitter':
      return { hexColor: '#1ba1f1' }
    default:
      return {}
  }
}

export const SocialButton = (props: SocialButtonProps) => {
  const { socialType, className, ...rest } = props
  const socialButtonProps = getSocialButtonProps(socialType)
  return (
    <Button
      {...socialButtonProps}
      {...rest}
      className={cn(styles.root, socialButtonProps.className, className)}
    >
      {getButtonLogo(socialType)}
    </Button>
  )
}
