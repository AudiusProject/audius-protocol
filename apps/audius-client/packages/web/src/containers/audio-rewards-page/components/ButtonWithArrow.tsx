import React from 'react'

import { Button, ButtonProps, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'

import styles from './ButtonWithArrow.module.css'

const ButtonWithArrow = (props: ButtonProps) => {
  return (
    <Button
      className={cn(styles.rewardButton, props.className)}
      type={ButtonType.PRIMARY_ALT}
      rightIcon={<IconArrow />}
      iconClassName={styles.buttonIcon}
      textClassName={cn(styles.text, props.textClassName)}
      {...props}
    />
  )
}

export default ButtonWithArrow
