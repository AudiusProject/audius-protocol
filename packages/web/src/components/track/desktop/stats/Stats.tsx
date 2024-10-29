import { memo, useMemo, MouseEvent, useCallback } from 'react'

import { Favorite, ID, Repost } from '@audius/common/models'
import { cacheUsersSelectors, CommonState } from '@audius/common/store'
import { createShallowSelector } from '@audius/common/utils'
import {
  IconHeart as IconFavorite,
  IconMessage,
  IconRepost
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import ProfileImage from './ProfileImage'
import styles from './Stats.module.css'
import { StatsText, Flavor } from './StatsText'
const { getUsers } = cacheUsersSelectors

const MAX_IMAGES = 3

const makeFolloweeActionsUsers = () =>
  createShallowSelector(
    [getUsers, (_state: CommonState, userIds: ID[]) => userIds],
    (users, userIds) =>
      userIds
        ? userIds.map((id) => users[id]).filter((u) => !!u && !u.is_deactivated)
        : []
  )

type StatsProps = {
  count: number
  followeeActions?: Repost[] | Favorite[]
  size: 'small' | 'medium' | 'large'
  showSkeleton?: boolean
  contentTitle: string
  onClick?: () => void
  flavor: Flavor
  hideImage?: boolean
  isOwner?: boolean
  allow0Count?: boolean
}

const Stats = memo((props: StatsProps) => {
  const {
    count,
    followeeActions = [],
    size,
    showSkeleton,
    contentTitle,
    onClick,
    flavor,
    hideImage,
    isOwner,
    allow0Count
  } = props

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!onClick || (!count && !allow0Count)) return
      e.stopPropagation()
      onClick()
    },
    [count, onClick, allow0Count]
  )

  const getFolloweeActionsUsers = useMemo(makeFolloweeActionsUsers, [])
  const followeeActionUsers = useSelector((state: CommonState) =>
    getFolloweeActionsUsers(
      state,
      (followeeActions as Array<Repost | Favorite>).map(
        (a: Repost | Favorite) => a.user_id
      )
    )
  )

  const profileImages = followeeActionUsers
    .slice(0, MAX_IMAGES)
    .map((item) => <ProfileImage key={item.user_id} userId={item.user_id} />)

  const Icon =
    flavor === Flavor.REPOST
      ? IconRepost
      : flavor === Flavor.FAVORITE
      ? IconFavorite
      : IconMessage

  return (
    <div
      className={cn(styles.root, {
        [styles.small]: size === 'small',
        [styles.large]: size === 'large',
        [styles.hide]: showSkeleton,
        [styles.show]: !showSkeleton,
        [styles.showNonEmpty]: !showSkeleton && (count || allow0Count)
      })}
      onClick={handleClick}
    >
      {size === 'large' &&
      flavor === Flavor.REPOST &&
      !hideImage &&
      profileImages.length > 0 ? (
        <div className={styles.profileImages}>{profileImages}</div>
      ) : null}
      <span className={styles.text}>
        {/* TODO: css hack to align the text. We need to fix the icon so we can use flex alignment */}
        <Icon size='xs' color='subdued' css={{ marginTop: 1 }} />
        <StatsText
          flavor={flavor}
          count={count}
          contentTitle={contentTitle}
          users={followeeActionUsers}
          size={size}
          isOwner={isOwner}
        />
      </span>
    </div>
  )
})

export default Stats
