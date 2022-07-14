import { memo, useMemo, MouseEvent } from 'react'

import { ID } from '@audius/common'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { ReactComponent as IconFavorite } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import { Favorite } from 'common/models/Favorite'
import { Repost } from 'common/models/Repost'
import { CommonState } from 'common/store'
import { getUsers } from 'common/store/cache/users/selectors'
import { formatCount } from 'common/utils/formatUtil'
import { createShallowSelector } from 'common/utils/selectorHelpers'

import ProfileImage from './ProfileImage'
import styles from './Stats.module.css'
import StatsText, { Flavor } from './StatsText'

const MAX_REPOST_IMAGES = 3
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
  size: string
  showSkeleton?: boolean
  contentTitle: string
  onClick?: () => void
  flavor: Flavor
  hideImage?: boolean
}

const Stats = memo(
  ({
    count,
    followeeActions = [],
    size,
    showSkeleton,
    contentTitle,
    onClick,
    flavor,
    hideImage
  }: StatsProps) => {
    const onClickWrapper = (e: MouseEvent) => {
      if (!onClick || !count) return
      e.stopPropagation()
      onClick()
    }

    const repostInfoStyle = cn(styles.repostInfo, {
      [styles.small]: size === 'small',
      [styles.large]: size === 'large'
    })

    const getFolloweeActionsUsers = useMemo(makeFolloweeActionsUsers, [])
    const followeeActionUsers = useSelector((state: CommonState) =>
      getFolloweeActionsUsers(
        state,
        (followeeActions as Array<Repost | Favorite>).map(
          (a: Repost | Favorite) => a.user_id
        )
      )
    )

    const slice = followeeActionUsers.slice(0, MAX_REPOST_IMAGES)

    // @ts-ignore
    const items = slice.map((item) => (
      <ProfileImage key={item.user_id} userId={item.user_id} />
    ))

    return (
      <>
        <div
          className={cn(repostInfoStyle, {
            [styles.hide]: showSkeleton,
            [styles.show]: !showSkeleton,
            [styles.showNonEmpty]: !showSkeleton && count
          })}
          onClick={onClickWrapper}>
          {size === 'large' && flavor === Flavor.REPOST && !hideImage ? (
            <div className={styles.repostProfileImages}>{items}</div>
          ) : null}
          <div className={styles.repostText}>
            {flavor === Flavor.REPOST ? (
              <IconRepost className={styles.iconRepost} />
            ) : (
              <IconFavorite className={styles.iconRepost} />
            )}
            {size === 'large' || size === 'medium' ? (
              <StatsText
                flavor={flavor}
                count={count}
                contentTitle={contentTitle}
                users={followeeActionUsers}
              />
            ) : (
              <span>{formatCount(count)}</span>
            )}
          </div>
        </div>
      </>
    )
  }
)

export default Stats
