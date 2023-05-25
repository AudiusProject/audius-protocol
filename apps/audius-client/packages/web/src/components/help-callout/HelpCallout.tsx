import { ReactNode } from 'react'

import cn from 'classnames'

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'

import styles from './HelpCallout.module.css'

export const HelpCallout = ({
  icon = <IconQuestionCircle />,
  content,
  className
}: {
  icon?: ReactNode
  content: ReactNode
  className?: string
}) => {
  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>{content}</div>
    </div>
  )
}
