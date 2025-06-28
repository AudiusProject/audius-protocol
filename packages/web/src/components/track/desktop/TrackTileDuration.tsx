import { useCurrentUserId, useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { playbackPositionSelectors, CommonState } from '@audius/common/store'
import {
  formatLineupTileDuration,
  isLongFormContent
} from '@audius/common/utils'
import { IconCheck, ProgressBar, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { messages } from '../trackTileMessages'

import styles from './TrackTileDuration.module.css'

const { getTrackPosition } = playbackPositionSelectors

type TrackTileDurationProps = {
  trackId: ID
  isLoading?: boolean
}

export const TrackTileDuration = ({
  trackId,
  isLoading
}: TrackTileDurationProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: track } = useTrack(trackId, {
    select: (track) => ({
      duration: track?.duration,
      genre: track?.genre
    })
  })

  const trackPositionInfo = useSelector((state: CommonState) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )

  if (isLoading || !track?.duration) {
    return null
  }

  const { duration, genre } = track

  return (
    <Text variant='body' size='xs' className={styles.topRight}>
      <div className={styles.duration}>
        {isLongFormContent({ genre }) && trackPositionInfo ? (
          trackPositionInfo.status === 'IN_PROGRESS' ? (
            <div className={styles.progressTextContainer}>
              <p className={styles.progressText}>
                {`${formatLineupTileDuration(
                  duration - trackPositionInfo.playbackPosition,
                  true,
                  true
                )} ${messages.timeLeft}`}
              </p>
              <ProgressBar
                value={(trackPositionInfo.playbackPosition / duration) * 100}
                sliderClassName={styles.progressTextSlider}
              />
            </div>
          ) : trackPositionInfo.status === 'COMPLETED' ? (
            <div className={styles.completeText}>
              {messages.played}
              <IconCheck className={styles.completeIcon} />
            </div>
          ) : (
            formatLineupTileDuration(duration, true, true)
          )
        ) : (
          formatLineupTileDuration(duration, isLongFormContent({ genre }), true)
        )}
      </div>
    </Text>
  )
}
