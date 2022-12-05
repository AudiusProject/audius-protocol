import {
  Button,
  ButtonSize,
  ButtonType,
  IconTikTokInverted
} from '@audius/stems'
import cn from 'classnames'

import styles from './TikTokButton.module.css'

type TikTokButtonProps = {
  text?: string
  textClassName?: string
  iconClassName?: string
  onClick?: () => void
  className?: string
}

export const TikTokButton = (props: TikTokButtonProps) => {
  const { text, className, onClick, textClassName, iconClassName } = props
  return (
    <Button
      type={ButtonType.PRIMARY_ALT}
      leftIcon={<IconTikTokInverted className={styles.icon} />}
      className={cn(styles.button, styles.includeHoverAnimations, className)}
      textClassName={cn(styles.text, textClassName)}
      iconClassName={cn(styles.icon, iconClassName)}
      size={ButtonSize.MEDIUM}
      text={text}
      onClick={onClick ?? (() => {})}
    />
  )
}
