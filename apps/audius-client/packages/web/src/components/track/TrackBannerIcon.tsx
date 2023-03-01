import { IconCollectible, IconLock, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'
import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'

import styles from './TrackBannerIcon.module.css'

export enum TrackBannerIconType {
  STAR = 'star',
  HIDDEN = 'hidden',
  LOCKED = 'locked',
  COLLECTIBLE_GATED = 'collectible gated',
  SPECIAL_ACCESS = 'special access'
}

const TrackBannerIcon = ({
  type,
  isMobile,
  isMatrixMode,
  className
}: {
  type: TrackBannerIconType
  isMobile?: boolean
  isMatrixMode: boolean
  className?: string
}) => {
  const renderIcon = () => {
    switch (type) {
      case TrackBannerIconType.STAR:
        return <IconStar />
      case TrackBannerIconType.HIDDEN:
        return <IconHidden />
      case TrackBannerIconType.LOCKED:
        return <IconLock />
      case TrackBannerIconType.COLLECTIBLE_GATED:
        return <IconCollectible />
      case TrackBannerIconType.SPECIAL_ACCESS:
        return <IconSpecialAccess />
    }
  }

  return (
    <div
      className={cn(styles.artistPick, className, {
        [styles.isMobile]: isMobile,
        [styles.matrix]: isMatrixMode
      })}
    >
      <div
        className={cn(styles.container, {
          [styles.gated]: [
            TrackBannerIconType.COLLECTIBLE_GATED,
            TrackBannerIconType.SPECIAL_ACCESS,
            TrackBannerIconType.LOCKED
          ].includes(type),
          [styles.star]: type === TrackBannerIconType.STAR,
          [styles.hidden]: type === TrackBannerIconType.HIDDEN
        })}
      />
      {renderIcon()}
    </div>
  )
}

export default TrackBannerIcon
