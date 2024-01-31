import { formatCount } from '@audius/common'
import { IconHeart as IconFavorite, IconRepost } from '@audius/harmony'
import cn from 'classnames'

import styles from './StatsButtonRow.module.css'

const messages = {
  plays: 'Plays'
}

type StatsButtonRowProps = {
  className?: string
  showListenCount: boolean
  showFavoriteCount: boolean
  showRepostCount: boolean
  listenCount?: number
  favoriteCount: number
  repostCount: number
  onClickFavorites: () => void
  onClickReposts: () => void
}

// A row of stats, visible on playlist and tracks pages.
const StatsButtonRow = ({
  className,
  showListenCount,
  showFavoriteCount,
  showRepostCount,
  favoriteCount,
  repostCount,
  onClickFavorites,
  onClickReposts,
  listenCount = 0
}: StatsButtonRowProps) => {
  const renderListenCount = () => {
    return (
      <div className={cn(styles.countContainer, styles.listenCount)}>
        <span className={styles.count}>{formatCount(listenCount)}</span>
        <span className={styles.countLabel}>{messages.plays}</span>
      </div>
    )
  }

  const renderFavoriteCount = () => {
    return (
      <div className={styles.countContainer} onClick={onClickFavorites}>
        <span className={styles.count}>{formatCount(favoriteCount)}</span>
        <IconFavorite />
      </div>
    )
  }

  const renderRepostCount = () => {
    return (
      <div className={styles.countContainer} onClick={onClickReposts}>
        <span className={styles.count}>{formatCount(repostCount)}</span>
        <IconRepost />
      </div>
    )
  }

  return (
    <>
      {(showListenCount || showFavoriteCount || showRepostCount) && (
        <div className={cn(styles.statsContainer, className)}>
          {showListenCount && renderListenCount()}
          {showFavoriteCount && renderFavoriteCount()}
          {showRepostCount && renderRepostCount()}
        </div>
      )}
    </>
  )
}

export default StatsButtonRow
