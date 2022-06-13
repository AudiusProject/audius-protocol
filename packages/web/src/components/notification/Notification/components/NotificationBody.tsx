import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './NotificationBody.module.css'

type NotificationBodyProps = {
  className?: string
  children: ReactNode
}

export const NotificationBody = (props: NotificationBodyProps) => {
  const { className, children } = props

  return (
    <div>
      <span className={cn(styles.root, className)}>{children}</span>
    </div>
  )
}
