import React from 'react'

import Skeleton from 'antd/lib/skeleton'
import cn from 'classnames'

import { SkeletonTileProps } from 'components/track/types'

import styles from './SkeletonTile.module.css'

const SkeletonTile = ({ index, tileSize, ordered }: SkeletonTileProps) => (
  <div className={styles.container}>
    <div className={styles.top}>
      <div className={styles.leftContainer}>
        <Skeleton
          active
          avatar
          paragraph={false}
          title={false}
          loading
          className={cn(styles.loadingArtImageSkeleton)}
        />
        <Skeleton
          active
          paragraph={{ rows: 1 }}
          title={false}
          loading
          className={cn(styles.skeletonText, styles.trackTime)}
        />
      </div>
      <div className={styles.trackInfo}>
        <div>
          <Skeleton
            active
            paragraph={{ rows: 1 }}
            title={false}
            loading
            className={cn(styles.skeletonText, styles.trackTitle)}
          />
          <Skeleton
            active
            paragraph={{ rows: 1 }}
            title={false}
            loading
            className={cn(styles.skeletonText, styles.artistName)}
          />
        </div>
      </div>
      <Skeleton
        active
        paragraph={{ rows: 1 }}
        title={false}
        loading
        className={cn(styles.skeletonText, styles.duration)}
      />
    </div>
    <div className={styles.bottom} />
  </div>
)

export default SkeletonTile
