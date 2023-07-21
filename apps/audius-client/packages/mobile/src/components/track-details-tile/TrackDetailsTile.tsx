import type { ID } from '@audius/common'
import {
  SquareSizes,
  getDogEarType,
  isPremiumContentCollectibleGated,
  usePremiumContentAccess,
  cacheUsersSelectors,
  cacheTracksSelectors
} from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import { DogEar, Text } from 'app/components/core'
import { TrackImage } from 'app/components/image/TrackImage'
import UserBadges from 'app/components/user-badges'
import { makeStyles, flexRowCentered, typography } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

const messages = {
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS'
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
  const accentBlue = useColor('accentBlue')
  const track = useSelector((state) => getTrack(state, { id: trackId }))
  const owner = useSelector((state) => getUser(state, { id: track?.owner_id }))
  const isCollectibleGated = isPremiumContentCollectibleGated(
    track?.premium_conditions
  )
  const { doesUserHaveAccess } = usePremiumContentAccess(track)

  const dogEarType = getDogEarType({
    doesUserHaveAccess,
    premiumConditions: track?.premium_conditions
  })

  if (!track || !owner) {
    return null
  }

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
            {isCollectibleGated ? (
              <IconCollectible
                fill={accentBlue}
                width={spacing(5)}
                height={spacing(5)}
              />
            ) : (
              <IconSpecialAccess
                fill={accentBlue}
                width={spacing(5)}
                height={spacing(5)}
              />
            )}
            <Text
              fontSize='small'
              color='accentBlue'
              weight='demiBold'
              style={styles.premiumContentLabel}
            >
              {isCollectibleGated
                ? messages.collectibleGated
                : messages.specialAccess}
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
