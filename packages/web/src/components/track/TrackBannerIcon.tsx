import cn from 'classnames'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'
import { ReactComponent as IconStar } from 'assets/img/iconStar.svg'

import styles from './TrackBannerIcon.module.css'

export enum TrackBannerIconType {
  STAR = 'star',
  HIDDEN = 'hidden'
}

const TrackBannerIcon = ({
  type,
  isMobile,
  isMatrixMode
}: {
  type: TrackBannerIconType
  isMobile?: boolean
  isMatrixMode: boolean
}) => {
  const renderIcon = () => {
    switch (type) {
      case TrackBannerIconType.STAR:
        return <IconStar />
      case TrackBannerIconType.HIDDEN:
        return <IconHidden />
    }
  }

  return (
    <div
      className={cn(styles.artistPick, {
        [styles.isMobile]: isMobile,
        [styles.matrix]: isMatrixMode
      })}>
      <div
        className={cn(styles.container, {
          [styles.star]: type === TrackBannerIconType.STAR,
          [styles.hidden]: type === TrackBannerIconType.HIDDEN
        })}
      />
      {renderIcon()}
    </div>
  )
}

export default TrackBannerIcon
