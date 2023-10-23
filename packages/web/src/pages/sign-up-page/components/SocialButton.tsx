import {
  Button,
  ButtonProps,
  IconInstagram,
  IconTikTok,
  IconTwitter
} from '@audius/harmony'
import cn from 'classnames'

import styles from './SocialButton.module.css'

type SocialMedia = 'tiktok' | 'instagram' | 'twitter'
export type SocialButtonProps = ButtonProps & {
  type: SocialMedia
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
  const { type, className, ...rest } = props
  return (
    <Button {...rest} className={cn(styles.root, styles[type], className)}>
      {getButtonLogo(type)}
    </Button>
  )
}
