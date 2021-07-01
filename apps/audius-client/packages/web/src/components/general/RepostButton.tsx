import React from 'react'

import { Button, IconRepost, ButtonType } from '@audius/stems'
import cn from 'classnames'

import styles from './RepostButton.module.css'

type RepostButtonProps = {
  reposted: boolean
  disabled: boolean
  className: string
  onClick: () => void
}

const RepostButton = (props: RepostButtonProps) => {
  let type
  if (props.reposted && !props.disabled) {
    type = ButtonType.PRIMARY_ALT
  } else if (!props.reposted && !props.disabled) {
    type = ButtonType.SECONDARY
  } else {
    type = ButtonType.DISABLED
  }
  return (
    <Button
      isDisabled={props.disabled}
      type={type}
      text={props.reposted ? 'Reposted' : 'Repost'}
      leftIcon={<IconRepost />}
      className={cn(props.className, styles.repostButton)}
      textClassName={styles.repostButtonText}
      iconClassName={styles.repostButtonIcon}
      onClick={props.onClick}
    />
  )
}

export default RepostButton
