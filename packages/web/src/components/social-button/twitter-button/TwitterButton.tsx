import { IconTwitter } from '@audius/harmony'
import cn from 'classnames'

import { SocialButton, SocialButtonProps } from '../SocialButton'

import styles from './TwitterButton.module.css'

export type TwitterButtonProps = SocialButtonProps

export const TwitterButton = (props: TwitterButtonProps) => {
  return (
    <SocialButton
      leftIcon={<IconTwitter />}
      {...props}
      className={cn(styles.button, props.className)}
    />
  )
}
