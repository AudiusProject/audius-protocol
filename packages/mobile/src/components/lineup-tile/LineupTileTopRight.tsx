import type { PremiumConditions, Nullable } from '@audius/common'
import { formatSeconds } from '@audius/common'
import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconHidden from 'app/assets/images/iconHidden.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import Text from 'app/components/text'
import { useIsPremiumContentEnabled } from 'app/hooks/useIsPremiumContentEnabled'
import { flexRowCentered } from 'app/styles'
import { useColor, useThemeColors } from 'app/utils/theme'

import { useStyles as useTrackTileStyles } from './styles'

const messages = {
  artistPick: "Artist's Pick",
  hiddenTrack: 'Hidden Track',
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access'
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
   * Whether or not the track is the artist pick
   */
  isArtistPick?: boolean
  /**
   * Whether or not the track is unlisted (hidden)
   */
  isUnlisted?: boolean
  /**
   * Whether or not to show the artist pick icon
   */
  showArtistPick?: boolean
  /**
   * Premium conditions to determine what icon and label to show
   */
  premiumConditions?: Nullable<PremiumConditions>
}

export const LineupTileTopRight = ({
  duration,
  isArtistPick,
  isUnlisted,
  showArtistPick,
  premiumConditions
}: Props) => {
  const isPremiumContentEnabled = useIsPremiumContentEnabled()
  const { neutralLight4 } = useThemeColors()
  const accentBlue = useColor('accentBlue')
  const trackTileStyles = useTrackTileStyles()

  return (
    <View style={styles.topRight}>
      {isPremiumContentEnabled && !!premiumConditions ? (
        <LineupTileTopRightItem
          icon={
            premiumConditions.nft_collection
              ? IconCollectible
              : IconSpecialAccess
          }
          label={
            premiumConditions.nft_collection
              ? messages.collectibleGated
              : messages.specialAccess
          }
          color={accentBlue}
        />
      ) : null}
      {(!isPremiumContentEnabled || !premiumConditions) &&
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
      <Text style={trackTileStyles.statText}>
        {duration && formatSeconds(duration)}
      </Text>
    </View>
  )
}
