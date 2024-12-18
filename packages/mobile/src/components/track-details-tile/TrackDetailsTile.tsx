import type { ComponentType } from 'react'
import { useMemo } from 'react'

import {
  SquareSizes,
  GatedContentType,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { cacheTracksSelectors, cacheUsersSelectors } from '@audius/common/store'
import type { ColorValue } from 'react-native'
import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { useSelector } from 'react-redux'

import {
  Flex,
  IconCart,
  IconCollectible,
  IconSpecialAccess
} from '@audius/harmony-native'
import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles, flexRowCentered, typography } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { TrackImage } from '../image/TrackImage'
import { TrackDogEar } from '../track/TrackDogEar'

const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

const messages = {
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  premiumTrack: 'PREMIUM TRACK',
  earn: (amount: string) => `Earn ${amount} $AUDIO for this purchase!`
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    width: '100%'
  },
  trackDetails: {
    ...flexRowCentered(),
    padding: spacing(4),
    gap: spacing(4)
  },
  trackImage: {
    width: spacing(22),
    height: spacing(22),
    borderRadius: spacing(1),
    borderColor: palette.neutralLight8
  },
  metadataContainer: {
    gap: spacing(1),
    flexShrink: 1
  },
  streamContentLabelContainer: {
    ...flexRowCentered(),
    gap: spacing(2)
  },
  streamContentLabel: {
    letterSpacing: spacing(0.5)
  },
  trackOwnerContainer: {
    ...flexRowCentered(),
    marginTop: spacing(1)
  },
  trackOwner: {
    fontFamily: typography.fontByWeight.medium,
    fontSize: typography.fontSize.medium
  }
}))

type TrackDetailsTileProps = {
  trackId: ID
  showLabel?: boolean
  earnAmount?: string
}

export const TrackDetailsTile = ({
  trackId,
  showLabel = true,
  earnAmount
}: TrackDetailsTileProps) => {
  const styles = useStyles()
  const { accentBlue, specialLightGreen } = useThemeColors()
  const track = useSelector((state) => getTrack(state, { id: trackId }))
  const owner = useSelector((state) => getUser(state, { id: track?.owner_id }))
  const isCollectibleGated = isContentCollectibleGated(track?.stream_conditions)
  const isUSDCPurchaseGated =
    useIsUSDCEnabled() && isContentUSDCPurchaseGated(track?.stream_conditions)

  const type = isUSDCPurchaseGated
    ? GatedContentType.USDC_PURCHASE
    : isCollectibleGated
      ? GatedContentType.COLLECTIBLE_GATED
      : GatedContentType.SPECIAL_ACCESS

  const headerAttributes: {
    [k in GatedContentType]: {
      message: string
      icon: ComponentType<SvgProps>
      color: ColorValue
    }
  } = useMemo(() => {
    return {
      [GatedContentType.COLLECTIBLE_GATED]: {
        message: messages.collectibleGated,
        icon: IconCollectible,
        color: accentBlue
      },
      [GatedContentType.SPECIAL_ACCESS]: {
        message: messages.specialAccess,
        icon: IconSpecialAccess,
        color: accentBlue
      },
      [GatedContentType.USDC_PURCHASE]: {
        message: messages.premiumTrack,
        icon: IconCart,
        color: specialLightGreen
      }
    }
  }, [accentBlue, specialLightGreen])

  if (!track || !owner) {
    return null
  }

  const { message: title, icon: IconComponent, color } = headerAttributes[type]

  return (
    <View style={styles.root}>
      <TrackDogEar trackId={trackId} />
      <View style={styles.trackDetails}>
        <TrackImage
          trackId={trackId}
          style={styles.trackImage}
          size={SquareSizes.SIZE_150_BY_150}
        />
        <View style={styles.metadataContainer}>
          {showLabel ? (
            <View style={styles.streamContentLabelContainer}>
              <IconComponent
                fill={color}
                width={spacing(5)}
                height={spacing(5)}
              />
              <Text
                fontSize='small'
                colorValue={color}
                weight='demiBold'
                textTransform='uppercase'
                style={styles.streamContentLabel}
              >
                {title}
              </Text>
            </View>
          ) : null}
          <Text
            fontSize='medium'
            weight='bold'
            textTransform='capitalize'
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={styles.trackOwnerContainer}>
            <Text fontSize='medium'>{owner.name}</Text>
            <UserBadges badgeSize={spacing(4)} user={owner} hideName />
          </View>
          {earnAmount ? (
            <Flex direction='row' alignItems='center' gap='xs' pt='xs'>
              <IconCart size='s' color='premium' />
              <Text fontSize='xs' color='specialLightGreen'>
                {messages.earn(earnAmount)}
              </Text>
            </Flex>
          ) : null}
        </View>
      </View>
    </View>
  )
}
