import type { ComponentType } from 'react'
import { useMemo } from 'react'

import type { ID } from '@audius/common'
import {
  SquareSizes,
  getDogEarType,
  isPremiumContentCollectibleGated,
  usePremiumContentAccess,
  cacheUsersSelectors,
  cacheTracksSelectors,
  isPremiumContentUSDCPurchaseGated,
  PremiumContentType
} from '@audius/common'
import type { ColorValue } from 'react-native'
import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import { DogEar, Text } from 'app/components/core'
import { TrackImage } from 'app/components/image/TrackImage'
import UserBadges from 'app/components/user-badges'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles, flexRowCentered, typography } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

const messages = {
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  premiumTrack: 'PREMIUM TRACK'
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
  premiumContentLabelContainer: {
    ...flexRowCentered(),
    gap: spacing(2)
  },
  premiumContentLabel: {
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
}

export const TrackDetailsTile = ({ trackId }: TrackDetailsTileProps) => {
  const styles = useStyles()
  const { accentBlue, specialLightGreen } = useThemeColors()
  const track = useSelector((state) => getTrack(state, { id: trackId }))
  const owner = useSelector((state) => getUser(state, { id: track?.owner_id }))
  const isCollectibleGated = isPremiumContentCollectibleGated(
    track?.premium_conditions
  )
  const isUSDCPurchaseGated =
    useIsUSDCEnabled() &&
    isPremiumContentUSDCPurchaseGated(track?.premium_conditions)
  const { doesUserHaveAccess } = usePremiumContentAccess(track)

  const dogEarType = getDogEarType({
    doesUserHaveAccess,
    premiumConditions: track?.premium_conditions
  })

  const type = isUSDCPurchaseGated
    ? PremiumContentType.USDC_PURCHASE
    : isCollectibleGated
    ? PremiumContentType.COLLECTIBLE_GATED
    : PremiumContentType.SPECIAL_ACCESS

  const headerAttributes: {
    [k in PremiumContentType]: {
      message: string
      icon: ComponentType<SvgProps>
      color: ColorValue
    }
  } = useMemo(() => {
    return {
      [PremiumContentType.COLLECTIBLE_GATED]: {
        message: messages.collectibleGated,
        icon: IconCollectible,
        color: accentBlue
      },
      [PremiumContentType.SPECIAL_ACCESS]: {
        message: messages.specialAccess,
        icon: IconSpecialAccess,
        color: accentBlue
      },
      [PremiumContentType.USDC_PURCHASE]: {
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
      {dogEarType ? <DogEar type={dogEarType} /> : null}
      <View style={styles.trackDetails}>
        <TrackImage
          style={styles.trackImage}
          track={track}
          size={SquareSizes.SIZE_150_BY_150}
        />
        <View style={styles.metadataContainer}>
          <View style={styles.premiumContentLabelContainer}>
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
              style={styles.premiumContentLabel}
            >
              {title}
            </Text>
          </View>
          <Text
            fontSize='xl'
            weight='bold'
            textTransform='capitalize'
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={styles.trackOwnerContainer}>
            <Text color='secondary' weight='demiBold' fontSize='small'>
              {owner.name}
            </Text>
            <UserBadges badgeSize={spacing(4)} user={owner} hideName />
          </View>
        </View>
      </View>
    </View>
  )
}
