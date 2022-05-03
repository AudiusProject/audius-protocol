import React, { ReactNode } from 'react'

import styles from './NotificationBody.module.css'

type NotificationBodyProps = {
  children: ReactNode
}

export const NotificationBody = (props: NotificationBodyProps) => {
  const { children } = props

  return <div className={styles.root}>{children}</div>
}
