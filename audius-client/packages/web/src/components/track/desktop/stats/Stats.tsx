import React, { memo } from 'react'

import cn from 'classnames'

import { ReactComponent as IconFavorite } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import { Favorite } from 'common/models/Favorite'
import { Repost } from 'common/models/Repost'
import { formatCount } from 'common/utils/formatUtil'

import ProfileImage from './ProfileImage'
import styles from './Stats.module.css'
import StatsText, { Flavor } from './StatsText'

const MAX_REPOST_IMAGES = 3

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
    const onClickWrapper = (e: React.MouseEvent) => {
      if (!onClick || !count) return
      e.stopPropagation()
      onClick()
    }

    const repostInfoStyle = cn(styles.repostInfo, {
      [styles.small]: size === 'small',
      [styles.large]: size === 'large'
    })

    const slice = followeeActions.slice(0, MAX_REPOST_IMAGES)

    // @ts-ignore
    const items = slice.map(item => (
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
          onClick={onClickWrapper}
        >
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
                // Map out all of the users so that the selector is cheaper inside the
                // rendered component
                userId1={slice[0] ? slice[0].user_id : undefined}
                userId2={slice[1] ? slice[1].user_id : undefined}
                userId3={slice[3] ? slice[2].user_id : undefined}
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
