import { ReactNode } from 'react'

import cn from 'classnames'

import IconQuestionCircle from 'assets/img/iconQuestionCircle.svg'

import styles from './HelpCallout.module.css'

/** @todo Rename to hint */
export const HelpCallout = ({
  icon = <IconQuestionCircle />,
  content,
  className,
  contentClassName
}: {
  icon?: ReactNode
  content: ReactNode
  className?: string
  contentClassName?: string
}) => {
  return (
    <div className={cn(styles.root, className)} role='alert'>
      <div className={styles.icon}>{icon}</div>
      <div className={cn(styles.content, contentClassName)}>{content}</div>
    </div>
  )
}
