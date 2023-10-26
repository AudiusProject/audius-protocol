import cn from 'classnames'

import { IconInstagram, IconTikTok, IconTwitter } from 'components/typography'

import { Button } from '../Button/Button'
import type { ButtonProps } from '../types'

import styles from './SocialButton.module.css'

type SocialMedia = 'tiktok' | 'instagram' | 'twitter'

export type SocialButtonProps = ButtonProps & {
  socialType: SocialMedia
  // Aria label is required since these buttons have no text
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
