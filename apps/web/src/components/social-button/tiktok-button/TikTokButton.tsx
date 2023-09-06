import { IconTikTokInverted } from '@audius/stems'
import cn from 'classnames'

import { SocialButton, SocialButtonProps } from '../SocialButton'

import styles from './TikTokButton.module.css'

export type TikTokButtonProps = SocialButtonProps

export const TikTokButton = (props: TikTokButtonProps) => {
  return (
    <SocialButton
      leftIcon={<IconTikTokInverted />}
      {...props}
      className={cn(styles.button, props.className)}
    />
  )
}
