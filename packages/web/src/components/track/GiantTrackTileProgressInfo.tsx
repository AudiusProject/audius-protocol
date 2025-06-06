import { useCurrentUserId } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { playbackPositionSelectors, CommonState } from '@audius/common/store'
import { formatLineupTileDuration } from '@audius/common/utils'
import { IconCheck, ProgressBar } from '@audius/harmony'
import { useSelector } from 'react-redux'

import styles from './GiantTrackTile.module.css'

const { getTrackPosition } = playbackPositionSelectors

const messages = {
  unplayed: 'Unplayed',
  timeLeft: 'left',
  played: 'Played'
}

type GiantTrackTileProgressInfoProps = {
  duration: number
  trackId: ID
}

export const GiantTrackTileProgressInfo = ({
  duration,
  trackId
}: GiantTrackTileProgressInfoProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const trackPositionInfo = useSelector((state: CommonState) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )

  if (trackPositionInfo) {
    if (trackPositionInfo.status === 'IN_PROGRESS') {
      const remainingTime = duration - trackPositionInfo.playbackPosition
      return (
        <div>
          <p className={styles.progressText}>
            {`${formatLineupTileDuration(remainingTime, true)} ${
              messages.timeLeft
            }`}
          </p>
          <ProgressBar
            value={(trackPositionInfo.playbackPosition / duration) * 100}
            sliderClassName={styles.progressTextSlider}
          />
        </div>
      )
    } else if (trackPositionInfo.status === 'COMPLETED') {
      return (
        <div>
          <p className={styles.completeText}>
            {messages.played}
            <IconCheck className={styles.completeTextIcon} />
          </p>
        </div>
      )
    }
  }

  return <p className={styles.progressText}>{messages.unplayed}</p>
}
