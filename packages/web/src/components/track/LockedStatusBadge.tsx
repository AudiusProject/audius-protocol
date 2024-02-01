import {} from '@audius/stems'
import { IconLock, IconLockUnlocked } from '@audius/harmony'
import cn from 'classnames'

import { Text } from 'components/typography'

import styles from './LockedStatusBadge.module.css'

export type LockedStatusBadgeProps = {
  locked: boolean
  variant?: 'premium' | 'gated'
  text?: string
  /** Whether the badge is colored when locked */
  coloredWhenLocked?: boolean
  iconSize?: 'medium' | 'small'
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = ({
  locked,
  variant = 'gated',
  text,
  coloredWhenLocked = false,
  iconSize = 'medium'
}: LockedStatusBadgeProps) => {
  const LockComponent = locked ? IconLock : IconLockUnlocked
  return (
    <div
      className={cn(
        styles.container,
        locked ? styles.locked : styles.unlocked,
        variant === 'premium' ? styles.premium : styles.gated,
        {
          [styles.hasText]: !!text,
          [styles.coloredWhenLocked]: !!coloredWhenLocked
        }
      )}
    >
      <LockComponent
        className={cn(
          styles.icon,
          iconSize === 'medium' ? styles.medium : styles.small
        )}
      />
      {text ? (
        <Text
          className={styles.text}
          size='xSmall'
          variant='label'
          color='white'
        >
          {text}
        </Text>
      ) : null}
    </div>
  )
}
