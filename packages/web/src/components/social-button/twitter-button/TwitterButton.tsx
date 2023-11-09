import cn from 'classnames'

import IconTwitter from 'assets/img/iconTwitterBird.svg'

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
