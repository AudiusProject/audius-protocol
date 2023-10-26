import cn from 'classnames'

import { IconInstagram, IconTikTok, IconTwitter } from 'components/typography'

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
      return <IconInstagram />
    case 'tiktok':
      return <IconTikTok />
    case 'twitter':
      return <IconTwitter />
    default:
      return undefined
  }
}

export const SocialButton = (props: SocialButtonProps) => {
  const { socialType, className, ...rest } = props
  return (
    <Button
      {...rest}
      className={cn(styles.root, styles[socialType], className)}
    >
      {getButtonLogo(socialType)}
    </Button>
  )
}
