import { formatCount } from '@audius/common'
import { ID } from '@audius/common/models'
import cn from 'classnames'

import IconUser from 'assets/img/iconUser.svg'
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
}
export const ArtistChipFollowers = ({
  userId,
  followerCount
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
      <FollowsYouBadge
        userId={userId}
        variant='list'
        className={cn(styles.followsYou, { [styles.darkMode]: darkMode })}
      />
    </div>
  )
}
