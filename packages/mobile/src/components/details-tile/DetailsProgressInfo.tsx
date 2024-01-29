import type { SearchTrack, Track } from '@audius/common'
import {
  accountSelectors,
  formatLineupTileDuration,
  playbackPositionSelectors
} from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconCheck } from '@audius/harmony-native'
import Text from 'app/components/text'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ProgressBar } from '../progress-bar'

const { getUserId } = accountSelectors
const { getTrackPosition } = playbackPositionSelectors

const messages = {
  played: 'Played',
  unplayed: 'Unplayed',
  inProgress: 'In Progress',
  timeLeft: 'left'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  progressInfoSection: {
    gap: spacing(2),
    marginBottom: spacing(4),
    paddingHorizontal: spacing(4)
  },

  progressInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  progressTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    gap: 2
  },

  progressInfoText: {
    fontSize: typography.body1.fontSize,
    color: palette.neutralLight4
  },

  progressTextIcon: {
    marginBottom: spacing(1)
  },

  progressTextProgressBar: {
    height: 4,
    marginVertical: 0
  }
}))

type DetailsProgressInfoProps = {
  track: Track | SearchTrack
}

export const DetailsProgressInfo = ({ track }: DetailsProgressInfoProps) => {
  const { duration } = track
  const { neutralLight4 } = useThemeColors()
  const styles = useStyles()
  const currentUserId = useSelector(getUserId)
  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId: track.track_id, userId: currentUserId })
  )

  const progressText = playbackPositionInfo
    ? playbackPositionInfo.status === 'IN_PROGRESS'
      ? messages.inProgress
      : messages.played
    : messages.unplayed

  const durationText =
    playbackPositionInfo?.status === 'IN_PROGRESS'
      ? `${formatLineupTileDuration(
          duration - playbackPositionInfo.playbackPosition,
          true
        )} ${messages.timeLeft}`
      : formatLineupTileDuration(duration, true)

  return (
    <View style={styles.progressInfoSection}>
      <View style={styles.progressInfoContainer}>
        <Text style={styles.progressInfoText} weight='demiBold'>
          {durationText}
        </Text>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressInfoText} weight='demiBold'>
            {progressText}
          </Text>
          {playbackPositionInfo?.status === 'COMPLETED' ? (
            <IconCheck
              style={styles.progressTextIcon}
              height={16}
              width={16}
              fill={neutralLight4}
            />
          ) : null}
        </View>
      </View>
      {playbackPositionInfo?.status === 'IN_PROGRESS' ? (
        <ProgressBar
          progress={
            duration
              ? (playbackPositionInfo.playbackPosition / duration) * 100
              : 0
          }
          max={100}
          style={{ root: styles.progressTextProgressBar }}
        />
      ) : null}
    </View>
  )
}
