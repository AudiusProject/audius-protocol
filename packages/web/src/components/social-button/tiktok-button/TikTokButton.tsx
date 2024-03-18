import { IconTikTok } from '@audius/harmony'
import cn from 'classnames'

import { SocialButton, SocialButtonProps } from '../SocialButton'

import styles from './TikTokButton.module.css'

export type TikTokButtonProps = SocialButtonProps

export const TikTokButton = (props: TikTokButtonProps) => {
  return (
    <SocialButton
      leftIcon={<IconTikTok color='staticWhite' />}
      {...props}
      className={cn(styles.button, props.className)}
    />
  )
}
