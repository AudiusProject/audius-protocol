import { useCallback, MouseEvent } from 'react'

import { IconHeart as IconFavorite, IconRepost } from '@audius/harmony'
import cn from 'classnames'
import numeral from 'numeral'

import styles from './RepostFavoritesStats.module.css'

const pluralize = (
  message: string,
  count: number | null,
  suffix = 's',
  pluralizeAnyway = false
) => `${message}${(count ?? 0) > 1 || pluralizeAnyway ? suffix : ''}`

/**
 * The format for counting numbers should be 4 characters if possible (3 numbers and 1 Letter) without trailing 0
 * ie.
 * 375 => 375
 * 4,210 => 4.21K
 * 56,010 => 56K
 * 443,123 => 443K
 * 4,001,000 => 4M Followers
 */
export const formatCount = (count: number) => {
  if (count >= 1000) {
    const countStr = count.toString()
    if (countStr.length % 3 === 0) {
      return numeral(count).format('0a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[2] !== '0') {
      return numeral(count).format('0.00a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[1] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else if (countStr.length % 3 === 2 && countStr[2] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else {
      return numeral(count).format('0a').toUpperCase()
    }
  } else if (!count) {
    return '0'
  } else {
    return `${count}`
  }
}

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
  onClickReposts?: () => void
  onClickFavorites?: () => void
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
      onClickReposts?.()
    },
    [onClickReposts]
  )
  const handleOnClickFavorites = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClickFavorites?.()
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
