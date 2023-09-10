import { Button, ButtonType, ButtonSize, ButtonProps } from '@audius/stems'
import cn from 'classnames'

import socialButtonStyles from './SocialButton.module.css'

export type SocialButtonProps = ButtonProps

export const SocialButton = (props: SocialButtonProps) => {
  return (
    <Button
      type={ButtonType.PRIMARY_ALT}
      size={ButtonSize.MEDIUM}
      {...props}
      className={cn(socialButtonStyles.socialButton, props.className)}
      textClassName={cn(socialButtonStyles.text, props.textClassName)}
      iconClassName={cn(socialButtonStyles.icon, props.iconClassName)}
    />
  )
}
