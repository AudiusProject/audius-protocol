import { formatCount } from '@audius/common'
import cn from 'classnames'

import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import { isDarkMode } from 'utils/theme/theme'

import styles from './ArtistChip.module.css'

const messages = {
  follower: 'Follower',
  followers: 'Followers'
}

type ArtistChipFollowersProps = {
  followerCount: number
  doesFollowCurrentUser: boolean
}
export const ArtistChipFollowers = ({
  followerCount,
  doesFollowCurrentUser
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
      {doesFollowCurrentUser ? (
        <FollowsYouBadge
          className={cn(styles.followsYou, { [styles.darkMode]: darkMode })}
        />
      ) : null}
    </div>
  )
}
