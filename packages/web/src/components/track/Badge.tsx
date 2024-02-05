import { ReactNode, memo } from 'react'

import cn from 'classnames'

import IconTrophy from 'assets/img/iconTrophy.svg'

import styles from './Badge.module.css'

const Badge = ({
  textLabel,
  className,
  icon
}: {
  textLabel: string
  className: string
  icon?: ReactNode
}) => (
  <div className={cn(className, styles.badge)}>
    <span className={styles.badgeIcon}>{icon || <IconTrophy />}</span>
    <span className={styles.badgeTextLabel}>{textLabel}</span>
  </div>
)

export default memo(Badge)
