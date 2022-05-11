import React, { MouseEventHandler, useCallback } from 'react'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'

import styles from './TwitterShareButton.module.css'

const messages = {
  share: 'Share'
}

type TwitterShareButtonProps = {
  onClick?: MouseEventHandler
}

export const TwitterShareButton = (props: TwitterShareButtonProps) => {
  const { onClick } = props

  const handleClick: MouseEventHandler = useCallback(
    event => {
      event.stopPropagation()
      onClick?.(event)
    },
    [onClick]
  )

  return (
    <button className={styles.root} onClick={handleClick}>
      <IconTwitterBird className={styles.icon} />
      {messages.share}
    </button>
  )
}
