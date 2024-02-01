import { SquareSizes } from '@audius/common/models'
import { TrackEntity } from '@audius/common/store'

import CoSign, { Size } from 'components/co-sign/CoSign'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './TrackContent.module.css'

type TrackContentProps = {
  track: TrackEntity
}

export const TrackContent = (props: TrackContentProps) => {
  const { track } = props

  const image = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={styles.trackContent}>
      <CoSign hideTooltip size={Size.SMALL} className={styles.cosign}>
        <DynamicImage
          wrapperClassName={styles.trackContentArtwork}
          image={image}
        />
      </CoSign>
      <span className={styles.trackContentText}>{track.title}</span>
    </div>
  )
}
