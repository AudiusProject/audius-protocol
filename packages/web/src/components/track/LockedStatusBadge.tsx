import { IconLock, IconLockUnlocked } from '@audius/stems'
import cn from 'classnames'

import styles from './LockedStatusBadge.module.css'

export type LockedStatusBadgeProps = {
  locked: boolean
  variant?: 'premium' | 'gated'
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = ({
  locked,
  variant = 'gated'
}: LockedStatusBadgeProps) => {
  const LockComponent = locked ? IconLock : IconLockUnlocked
  return (
    <div
      className={cn(
        styles.container,
        locked ? styles.locked : styles.unlocked,
        variant === 'premium' ? styles.premium : styles.gated
      )}
    >
      <LockComponent className={styles.icon} />
    </div>
  )
}
