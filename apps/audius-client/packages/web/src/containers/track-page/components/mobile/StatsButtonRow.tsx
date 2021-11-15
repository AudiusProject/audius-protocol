import React from 'react'

import cn from 'classnames'

import { ReactComponent as IconFavorite } from 'assets/img/iconHeart.svg'
import { ReactComponent as IconRepost } from 'assets/img/iconRepost.svg'
import { formatCount } from 'common/utils/formatUtil'

import styles from './StatsButtonRow.module.css'

const messages = {
  plays: 'Plays'
}

type StatsButtonRowProps = {
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
        <div className={styles.countLabel}>
          <IconFavorite />
        </div>
      </div>
    )
  }

  const renderRepostCount = () => {
    return (
      <div className={styles.countContainer} onClick={onClickReposts}>
        <span className={styles.count}>{formatCount(repostCount)}</span>
        <div className={styles.countLabel}>
          <IconRepost />
        </div>
      </div>
    )
  }

  return (
    <>
      {(showListenCount || showFavoriteCount || showRepostCount) && (
        <div className={styles.statsContainer}>
          {showListenCount && renderListenCount()}
          {showFavoriteCount && renderFavoriteCount()}
          {showRepostCount && renderRepostCount()}
        </div>
      )}
    </>
  )
}

export default StatsButtonRow
