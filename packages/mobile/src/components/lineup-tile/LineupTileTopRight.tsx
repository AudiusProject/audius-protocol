import type { PremiumConditions, Nullable } from '@audius/common'
import {
  FeatureFlags,
  accountSelectors,
  playbackPositionSelectors,
  formatLineupTileDuration
} from '@audius/common'
import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { useSelector } from 'react-redux'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconHidden from 'app/assets/images/iconHidden.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import IconUnlocked from 'app/assets/images/iconUnlocked.svg'
import Text from 'app/components/text'
import { useIsGatedContentEnabled } from 'app/hooks/useIsGatedContentEnabled'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { flexRowCentered } from 'app/styles'
import { useColor, useThemeColors } from 'app/utils/theme'

import { ProgressBar } from '../progress-bar'

import { useStyles as useTrackTileStyles } from './styles'

const { getUserId } = accountSelectors
const { getTrackPosition } = playbackPositionSelectors

const messages = {
  artistPick: "Artist's Pick",
  hiddenTrack: 'Hidden Track',
  timeLeft: 'left',
  played: 'Played'
}

const flexRowEnd = (): ViewStyle => ({
  ...flexRowCentered(),
  justifyContent: 'flex-end'
})

const styles = StyleSheet.create({
  topRight: {
    ...flexRowEnd(),
    position: 'absolute',
    top: 10,
    right: 10,
    left: 0
  },
  item: {
    ...flexRowEnd(),
    marginRight: 8
  },
  icon: {
    marginRight: 4
  }
})

type ItemProps = {
  /**
   * Icon shown on the left hand side of the item
   */
  icon: React.FC<SvgProps>
  /**
   * Label shown on the right hand side of the item
   */
  label: string
  /**
   * Color of icon and label
   */
  color: string
}

const LineupTileTopRightItem = ({ icon: Icon, label, color }: ItemProps) => {
  const trackTileStyles = useTrackTileStyles()
  return (
    <View style={styles.item}>
      <Icon height={16} width={16} fill={color} style={styles.icon} />
      <Text style={{ ...trackTileStyles.statText, color }}>{label}</Text>
    </View>
  )
}

type Props = {
  /**
   * The duration of the track or tracks
   */
  duration?: number
  /**
   * The id of the track
   */
  trackId?: number
  /**
   * Whether or not the track is the artist pick
   */
  isArtistPick?: boolean
  /**
   * Whether or not the track is long-form content (podcast/audiobook/etc)
   */
  isLongFormContent?: boolean
  /**
   * Whether or not the track is unlisted (hidden)
   */
  isUnlisted?: boolean
  /**
   * Whether or not to show the artist pick icon
   */
  showArtistPick?: boolean
  /**
   * Whether logged in user is owner
   */
  isOwner?: boolean
  /**
   * Whether logged in user has access
   */
  doesUserHaveAccess?: boolean
  /**
   * Premium conditions to determine what icon and label to show
   */
  premiumConditions?: Nullable<PremiumConditions>
}

export const LineupTileTopRight = ({
  duration,
  trackId,
  isArtistPick,
  isLongFormContent,
  isUnlisted,
  showArtistPick,
  isOwner,
  doesUserHaveAccess,
  premiumConditions
}: Props) => {
  const isGatedContentEnabled = useIsGatedContentEnabled()
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { neutralLight4, secondary } = useThemeColors()
  const accentBlue = useColor('accentBlue')
  const trackTileStyles = useTrackTileStyles()
  const currentUserId = useSelector(getUserId)
  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )

  const isInProgress =
    isNewPodcastControlsEnabled &&
    playbackPositionInfo?.status === 'IN_PROGRESS'
  const isCompleted =
    isNewPodcastControlsEnabled && playbackPositionInfo?.status === 'COMPLETED'

  const durationText = duration
    ? isInProgress
      ? `${formatLineupTileDuration(
          duration - playbackPositionInfo.playbackPosition,
          isLongFormContent
        )} ${messages.timeLeft}`
      : formatLineupTileDuration(duration, isLongFormContent)
    : null

  return (
    <View style={styles.topRight}>
      {isGatedContentEnabled &&
      !!premiumConditions &&
      !isOwner &&
      doesUserHaveAccess ? (
        <LineupTileTopRightItem
          icon={IconUnlocked}
          label=''
          color={accentBlue}
        />
      ) : null}
      {isGatedContentEnabled &&
      !!premiumConditions &&
      (isOwner || !doesUserHaveAccess) ? (
        <LineupTileTopRightItem
          icon={
            premiumConditions.nft_collection
              ? IconCollectible
              : IconSpecialAccess
          }
          label=''
          color={accentBlue}
        />
      ) : null}
      {(!isGatedContentEnabled || !premiumConditions) &&
      showArtistPick &&
      isArtistPick ? (
        <LineupTileTopRightItem
          icon={IconStar}
          label={messages.artistPick}
          color={neutralLight4}
        />
      ) : null}
      {isUnlisted && (
        <LineupTileTopRightItem
          icon={IconHidden}
          label={messages.hiddenTrack}
          color={neutralLight4}
        />
      )}
      <View style={trackTileStyles.statTextContainer}>
        <Text
          style={[
            trackTileStyles.statText,
            isCompleted ? trackTileStyles.completeStatText : null
          ]}
        >
          {isCompleted ? messages.played : durationText}
          {isCompleted ? (
            <IconCheck height={12} width={14} fill={secondary} />
          ) : null}
        </Text>
        {duration && isInProgress ? (
          <ProgressBar
            progress={(playbackPositionInfo.playbackPosition / duration) * 100}
            max={100}
            style={{ root: trackTileStyles.statTextProgressBar }}
          />
        ) : null}
      </View>
    </View>
  )
}
