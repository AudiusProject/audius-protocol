import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './FollowsYouBadge.module.css'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  className?: string
  /** For badges appearing in a list, expose a variant with a transparent background */
  variant?: 'standard' | 'list'
}

const FollowsYouBadge = ({
  className = '',
  variant = 'standard'
}: FollowsYouBadgeProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  return (
    <div
      className={wm(
        styles.badge,
        { [styles.list]: variant === 'list' },
        className
      )}
    >
      {messages.followsYou}
    </div>
  )
}

export default FollowsYouBadge
