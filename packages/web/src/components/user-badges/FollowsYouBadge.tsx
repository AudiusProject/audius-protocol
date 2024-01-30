import { accountSelectors } from '@audius/common'
import { ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { trpc } from 'utils/trpcClientWeb'

import styles from './FollowsYouBadge.module.css'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  userId: ID
  className?: string
  /** For badges appearing in a list, expose a variant with a transparent background */
  variant?: 'standard' | 'list'
}

const FollowsYouBadge = ({
  userId,
  className = '',
  variant = 'standard'
}: FollowsYouBadgeProps) => {
  const currentUserId = useSelector(accountSelectors.getUserId)
  const { data } = trpc.me.userRelationship.useQuery(
    {
      theirId: userId.toString()
    },
    {
      enabled: !!currentUserId
    }
  )
  const wm = useWithMobileStyle(styles.mobile)

  if (!data?.followsMe) return null

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
