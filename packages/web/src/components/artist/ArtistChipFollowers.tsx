import { ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import { IconUser } from '@audius/harmony'
import cn from 'classnames'

import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import { isDarkMode } from 'utils/theme/theme'

import styles from './ArtistChip.module.css'

const messages = {
  follower: 'Follower',
  followers: 'Followers'
}

type ArtistChipFollowersProps = {
  userId: ID
  followerCount: number
  showFollowsYou: boolean
}
export const ArtistChipFollowers = ({
  userId,
  followerCount,
  showFollowsYou
}: ArtistChipFollowersProps) => {
  const darkMode = isDarkMode()
  return (
    <div className={styles.followersContainer}>
      <div className={cn(styles.followers, 'followers')}>
        <IconUser className={styles.icon} />
        <span className={styles.value}>{formatCount(followerCount)}</span>
        <span className={styles.label}>
          {followerCount === 1
            ? `${messages.follower}`
            : `${messages.followers}`}
        </span>
      </div>
      {showFollowsYou ? (
        <FollowsYouBadge
          userId={userId}
          variant='list'
          className={cn(styles.followsYou, { [styles.darkMode]: darkMode })}
        />
      ) : null}
    </div>
  )
}
