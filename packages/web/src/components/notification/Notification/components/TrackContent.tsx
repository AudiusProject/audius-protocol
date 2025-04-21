import { SquareSizes } from '@audius/common/models'
import { TrackEntity } from '@audius/common/store'

import TrackFlair, { Size } from 'components/co-sign/TrackFlair'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './TrackContent.module.css'

type TrackContentProps = {
  track: TrackEntity
}

export const TrackContent = (props: TrackContentProps) => {
  const { track } = props

  const image = useTrackCoverArt({
    trackId: track.track_id,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <div className={styles.trackContent}>
      <TrackFlair
        hideToolTip
        id={track.track_id}
        size={Size.SMALL}
        className={styles.cosign}
      >
        <DynamicImage
          wrapperClassName={styles.trackContentArtwork}
          image={image}
        />
      </TrackFlair>
      <span className={styles.trackContentText}>{track.title}</span>
    </div>
  )
}
