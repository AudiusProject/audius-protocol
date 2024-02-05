import { useCallback, MouseEvent } from 'react'

import { pluralize, formatCount } from '@audius/common'
import cn from 'classnames'

import IconFavorite from 'assets/img/iconHeart.svg'
import IconRepost from 'assets/img/iconRepost.svg'

import styles from './RepostFavoritesStats.module.css'

export enum Size {
  // With text
  LARGE = 'large',
  // Just icons
  SMALL = 'small'
}

type RepostFavoritesStatsProps = {
  isUnlisted: boolean
  repostCount: number
  saveCount: number
  onClickReposts: () => void
  onClickFavorites: () => void
  className?: string
  size?: Size
}

const messages = {
  reposts: 'Repost',
  favorites: 'Favorite'
}

const RepostFavoritesStats = ({
  isUnlisted,
  repostCount,
  saveCount,
  onClickReposts,
  onClickFavorites,
  className,
  size = Size.LARGE
}: RepostFavoritesStatsProps) => {
  const handleOnClickReposts = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClickReposts()
    },
    [onClickReposts]
  )
  const handleOnClickFavorites = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClickFavorites()
    },
    [onClickFavorites]
  )

  if (isUnlisted) return null
  return !!repostCount || !!saveCount ? (
    <div
      className={cn(styles.statsRow, className, {
        [styles.small]: size === Size.SMALL
      })}
    >
      {!!repostCount && (
        <div className={styles.statItem} onClick={handleOnClickReposts}>
          <IconRepost />
          <span>{formatCount(repostCount)}</span>
          {size === Size.LARGE && pluralize(messages.reposts, repostCount)}
        </div>
      )}
      {!!saveCount && (
        <div className={styles.statItem} onClick={handleOnClickFavorites}>
          <div className={styles.iconFavorite}>
            <IconFavorite />
          </div>
          <span>{formatCount(saveCount)}</span>
          {size === Size.LARGE && pluralize(messages.favorites, saveCount)}
        </div>
      )}
    </div>
  ) : null
}

export default RepostFavoritesStats
