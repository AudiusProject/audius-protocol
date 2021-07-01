import React, { useCallback } from 'react'

import CoSign, { Size } from 'components/co-sign/CoSign'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useImageSize'
import Collection from 'models/Collection'
import Track from 'models/Track'
import User from 'models/User'
import { SquareSizes } from 'models/common/ImageSizes'

import styles from './TrackContent.module.css'
const TrackContent = ({
  notification,
  goToEntityPage
}: {
  notification: any
  goToEntityPage: (entity: User | Track | Collection) => void
}) => {
  const track = notification.entities.find(
    (track: Track) => track.track_id === notification.childTrackId
  )

  const image = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  const onClickName = useCallback(
    e => {
      if (e) e.stopPropagation()
      goToEntityPage(track)
    },
    [track, goToEntityPage]
  )

  return (
    <div className={styles.trackContent}>
      <CoSign hideTooltip size={Size.SMALL} className={styles.cosign}>
        <DynamicImage
          wrapperClassName={styles.trackContentArtwork}
          image={image}
        />
      </CoSign>
      <span className={styles.trackContentText} onClick={onClickName}>
        {track.title}
      </span>
    </div>
  )
}

export default TrackContent
