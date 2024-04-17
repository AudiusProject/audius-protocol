import { IconLockUnlocked, IconSize, Text } from '@audius/harmony'
import IconLock from '@audius/harmony/src/assets/icons/Lock.svg'
import cn from 'classnames'

import styles from './LockedStatusBadge.module.css'

const messages = {
  premiumLocked: 'Available for purchase',
  premiumUnlocked: 'Purchased'
}

export type LockedStatusBadgeProps = {
  locked: boolean
  variant?: 'premium' | 'gated'
  text?: string
  /** Whether the badge is colored when locked */
  coloredWhenLocked?: boolean
  iconSize?: IconSize
  id?: string
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = (props: LockedStatusBadgeProps) => {
  const {
    locked,
    variant = 'gated',
    text,
    coloredWhenLocked = false,
    iconSize = 'xs',
    id
  } = props

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
        color='staticWhite'
        size={iconSize}
        id={text ? undefined : id}
        title={
          text
            ? undefined
            : variant === 'premium'
            ? locked
              ? messages.premiumLocked
              : messages.premiumUnlocked
            : undefined
        }
      />
      {text ? (
        <Text size='xs' variant='label' color='staticWhite' id={id}>
          {text}
        </Text>
      ) : null}
    </div>
  )
}
