import { Button, ButtonProps, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'

import styles from './ButtonWithArrow.module.css'

const ButtonWithArrow = (props: { completed?: string } & ButtonProps) => {
  const buttonType =
    props.completed === 'completed'
      ? ButtonType.PRIMARY_ALT
      : props.completed === 'disbursed'
      ? ButtonType.COMMON_ALT
      : ButtonType.COMMON
  return (
    <Button
      className={cn(styles.rewardButton, props.className)}
      type={buttonType}
      rightIcon={<IconArrow />}
      iconClassName={styles.buttonIcon}
      textClassName={cn(styles.text, props.textClassName)}
      {...props}
    />
  )
}

export default ButtonWithArrow
