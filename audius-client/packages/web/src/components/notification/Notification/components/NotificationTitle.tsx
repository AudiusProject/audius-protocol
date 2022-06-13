import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './NotificationTitle.module.css'

type NotificationTitleProps = {
  className?: string
  children: ReactNode
}

export const NotificationTitle = (props: NotificationTitleProps) => {
  const { className, children } = props
  return <h3 className={cn(styles.root, className)}>{children}</h3>
}
