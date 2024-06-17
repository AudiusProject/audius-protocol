import { formatCount } from '@audius/common/utils'
import {
  Flex,
  IconHeart as IconFavorite,
  IconPlay,
  IconRepost
} from '@audius/harmony'
import cn from 'classnames'

import styles from './StatsButtonRow.module.css'

const messages = {
  reposts: 'Reposts',
  favorites: 'Favorites'
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
  if (!showListenCount && !showFavoriteCount && !showRepostCount) return null

  const renderListenCount = () => {
    return (
      <div className={cn(styles.countContainer, styles.listenCount)}>
        <IconPlay />
        <span className={styles.count}>{formatCount(listenCount)}</span>
      </div>
    )
  }

  const renderFavoriteCount = () => {
    return (
      <div className={styles.countContainer} onClick={onClickFavorites}>
        <IconFavorite />
        <span className={styles.count}>{formatCount(favoriteCount)}</span>
        <span className={styles.countLabel}>{messages.favorites}</span>
      </div>
    )
  }

  const renderRepostCount = () => {
    return (
      <div className={styles.countContainer} onClick={onClickReposts}>
        <IconRepost />
        <span className={styles.count}>{formatCount(repostCount)}</span>
        <span className={styles.countLabel}>{messages.reposts}</span>
      </div>
    )
  }

  return (
    <Flex gap='xl' className={className} justifyContent='flex-start'>
      {showListenCount && renderListenCount()}
      {showRepostCount && renderRepostCount()}
      {showFavoriteCount && renderFavoriteCount()}
    </Flex>
  )
}

export default StatsButtonRow
