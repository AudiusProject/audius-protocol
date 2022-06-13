import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './FollowsYouBadge.module.css'

const messages = {
  followsYou: 'Follows You'
}

const FollowsYouBadge = ({ className = '' }: { className?: string }) => {
  const wm = useWithMobileStyle(styles.mobile)
  return (
    <div className={wm(styles.badge, className)}>{messages.followsYou}</div>
  )
}

export default FollowsYouBadge
