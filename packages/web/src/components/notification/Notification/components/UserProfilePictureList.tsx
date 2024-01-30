import { formatCount } from '@audius/common'
import { User } from '@audius/common/models'
import cn from 'classnames'

import Tooltip from 'components/tooltip/Tooltip'

import { USER_LENGTH_LIMIT } from '../utils'

import { ProfilePicture } from './ProfilePicture'
import styles from './UserProfilePictureList.module.css'

const messages = {
  viewAllTooltip: 'View All'
}

export type UserProfileListProps = {
  /**
   * Here we have both users and totalUserCount because we need the total number
   * of users which is different that the number users whose profile pictures
   * will show up.
   * Sometimes the total number of users is not available,
   * e.g. for followers and supporters, we have follower_count and supporter_count.
   * When this is the case, we use this totalUserCount prop to inform how many total users there are.
   */
  users: Array<User>
  totalUserCount: number
  limit?: number
  disableProfileClick?: boolean
  disablePopover?: boolean
  stopPropagation?: boolean
  profilePictureClassname?: string
}

export const UserProfilePictureList = ({
  users,
  totalUserCount,
  limit = USER_LENGTH_LIMIT,
  disableProfileClick = false,
  disablePopover = false,
  stopPropagation = false,
  profilePictureClassname
}: UserProfileListProps) => {
  const showUserListModal = totalUserCount > limit
  /**
   * We add a +1 because the remaining users count includes
   * the tile that has the +N itself.
   */
  const remainingUsersCount = totalUserCount - limit + 1
  /**
   * If the total user count is greater than the limit, then
   * we slice at limit -1 to exclude the tile with the +N, since
   * that tile will be handled separately.
   * Otherwise, we slice at the limit, which would include all
   * users.
   */
  const sliceLimit = showUserListModal ? limit - 1 : limit
  const lastUser = users[limit - 1]

  return (
    <div className={styles.root}>
      {users
        .filter((u) => !u.is_deactivated)
        .slice(0, sliceLimit)
        .map((user) => (
          <ProfilePicture
            key={user.user_id}
            className={cn(styles.profilePicture, profilePictureClassname, {
              [styles.disabled]: disableProfileClick
            })}
            user={user}
            disableClick={disableProfileClick}
            disablePopover={disablePopover}
            stopPropagation={stopPropagation}
          />
        ))}
      {showUserListModal && lastUser ? (
        <Tooltip text={messages.viewAllTooltip} disabled={disableProfileClick}>
          <div
            className={cn(styles.profilePictureExtraRoot, {
              [styles.disabled]: disableProfileClick
            })}
          >
            <ProfilePicture
              disablePopover
              className={cn(
                styles.profilePictureExtra,
                profilePictureClassname
              )}
              user={lastUser}
            />
            <span className={styles.profilePictureCount}>
              {`+${formatCount(remainingUsersCount)}`}
            </span>
          </div>
        </Tooltip>
      ) : null}
    </div>
  )
}
