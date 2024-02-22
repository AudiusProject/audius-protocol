import { memo, useMemo, MouseEvent, useCallback } from 'react'

import { Favorite, ID, Repost } from '@audius/common/models'
import { cacheUsersSelectors, CommonState } from '@audius/common/store'
import { createShallowSelector } from '@audius/common/utils'
import { IconHeart as IconFavorite, IconRepost } from '@audius/harmony'
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
  followeeActions: Repost[] | Favorite[]
  size: 'small' | 'medium' | 'large'
  showSkeleton?: boolean
  contentTitle: string
  onClick?: () => void
  flavor: Flavor
  hideImage?: boolean
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
    hideImage
  } = props

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!onClick || !count) return
      e.stopPropagation()
      onClick()
    },
    [count, onClick]
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

  const Icon = flavor === Flavor.REPOST ? IconRepost : IconFavorite

  return (
    <div
      className={cn(styles.root, {
        [styles.small]: size === 'small',
        [styles.large]: size === 'large',
        [styles.hide]: showSkeleton,
        [styles.show]: !showSkeleton,
        [styles.showNonEmpty]: !showSkeleton && count
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
        <Icon size='xs' color='subdued' />
        <StatsText
          flavor={flavor}
          count={count}
          contentTitle={contentTitle}
          users={followeeActionUsers}
          size={size}
        />
      </span>
    </div>
  )
})

export default Stats
