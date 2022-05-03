import React, { ReactElement, ReactNode } from 'react'

import styles from './NotificationHeader.module.css'

type NotificationHeaderProps = {
  icon: ReactElement
  children: ReactNode
}

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const { icon, children } = props
  return (
    <div className={styles.root}>
      {icon}
      {children}
    </div>
  )
}
