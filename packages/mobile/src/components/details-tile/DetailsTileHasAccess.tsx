import type { ReactNode } from 'react'
import { useCallback } from 'react'

import type { PremiumConditions, User } from '@audius/common'
import { usePremiumConditionsEntity } from '@audius/common'
import type { ViewStyle } from 'react-native'
import { View, Text } from 'react-native'

import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import IconUnlocked from 'app/assets/images/iconUnlocked.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { useLink } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor, useThemePalette } from 'app/utils/theme'

const messages = {
  unlocked: 'UNLOCKED',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  unlockedCollectibleGatedPrefix: 'A Collectible from ',
  unlockedCollectibleGatedSuffix:
    ' was found in a linked wallet. This track is now available.',
  ownerCollectibleGatedPrefix:
    'Users can unlock access by linking a wallet containing a collectible from ',
  unlockedFollowGatedPrefix: 'Thank you for following ',
  unlockedFollowGatedSuffix: '! This track is now available.',
  ownerFollowGated: 'Users can unlock access by following your account!',
  unlockedTipGatedPrefix: 'Thank you for supporting ',
  unlockedTipGatedSuffix:
    ' by sending them a tip! This track is now available.',
  ownerTipGated: 'Users can unlock access by sending you a tip!'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    marginBottom: spacing(4),
    padding: spacing(4),
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2)
  },
  headerContainer: {
    ...flexRowCentered(),
    marginBottom: spacing(2),
    justifyContent: 'space-between'
  },
  titleContainer: {
    ...flexRowCentered()
  },
  title: {
    marginLeft: spacing(2),
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    color: palette.neutral
  },
  descriptionContainer: {
    ...flexRowCentered(),
    flexWrap: 'wrap'
  },
  description: {
    flexShrink: 0,
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.medium,
    color: palette.neutral,
    lineHeight: spacing(6)
  },
  checkIcon: {
    width: spacing(6),
    height: spacing(6)
  },
  name: {
    color: palette.secondary
  },
  bottomMargin: {
    marginBottom: spacing(2)
  }
}))

type HasAccessProps = {
  renderDescription: () => ReactNode
  isCollectibleGated?: boolean
  style?: ViewStyle
}

const DetailsTileUnlockedSection = ({
  renderDescription,
  style
}: HasAccessProps) => {
  const styles = useStyles()
  const palette = useThemePalette()

  return (
    <View style={[styles.root, style]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <IconUnlocked fill={palette.neutral} />
          <Text style={styles.title}>{messages.unlocked}</Text>
        </View>
        <IconVerified
          style={styles.checkIcon}
          fill={palette.accentGreen}
          fillSecondary={palette.staticWhite}
        />
      </View>
      {renderDescription()}
    </View>
  )
}

const DetailsTileOwnerSection = ({
  renderDescription,
  isCollectibleGated,
  style
}: HasAccessProps) => {
  const styles = useStyles()
  const neutral = useColor('neutral')

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.titleContainer, styles.bottomMargin]}>
        {isCollectibleGated ? (
          <IconCollectible fill={neutral} width={16} height={16} />
        ) : (
          <IconSpecialAccess fill={neutral} width={16} height={16} />
        )}
        <Text style={styles.title}>
          {isCollectibleGated
            ? messages.collectibleGated
            : messages.specialAccess}
        </Text>
      </View>
      {renderDescription()}
    </View>
  )
}

type DetailsTileHasAccessProps = {
  premiumConditions: PremiumConditions
  isOwner: boolean
  style?: ViewStyle
}

export const DetailsTileHasAccess = ({
  premiumConditions,
  isOwner,
  style
}: DetailsTileHasAccessProps) => {
  const styles = useStyles()
  const navigation = useNavigation()

  const { nftCollection, collectionLink, followee, tippedUser } =
    usePremiumConditionsEntity(premiumConditions)

  const { onPress: handlePressCollection } = useLink(collectionLink)

  const handlePressArtistName = useCallback(
    (handle: string) => () => {
      navigation.push('Profile', { handle })
    },
    [navigation]
  )

  const renderOwnerDescription = useCallback(() => {
    if (nftCollection) {
      return (
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.ownerCollectibleGatedPrefix}
            </Text>
            <Text
              onPress={handlePressCollection}
              style={[styles.description, styles.name]}
            >
              {nftCollection.name}
            </Text>
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.descriptionContainer}>
        <Text>
          <Text style={styles.description}>
            {followee ? messages.ownerFollowGated : messages.ownerTipGated}
          </Text>
        </Text>
      </View>
    )
  }, [nftCollection, followee, handlePressCollection, styles])

  const renderUnlockedSpecialAccessDescription = useCallback(
    (args: { entity: User; prefix: string; suffix: string }) => {
      const { entity, prefix, suffix } = args
      return (
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>{prefix}</Text>
            <Text
              style={[styles.description, styles.name]}
              onPress={handlePressArtistName(entity.handle)}
            >
              {entity.name}
            </Text>
            <UserBadges
              badgeSize={16}
              user={entity}
              nameStyle={styles.description}
              hideName
            />
            <Text style={styles.description}>{suffix}</Text>
          </Text>
        </View>
      )
    },
    [styles, handlePressArtistName]
  )

  const renderUnlockedDescription = useCallback(() => {
    if (nftCollection) {
      return (
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.unlockedCollectibleGatedPrefix}
            </Text>
            <Text
              style={[styles.description, styles.name]}
              onPress={handlePressCollection}
            >
              {nftCollection.name}
            </Text>
            <Text style={styles.description}>
              {messages.unlockedCollectibleGatedSuffix}
            </Text>
          </Text>
        </View>
      )
    }
    if (followee) {
      return renderUnlockedSpecialAccessDescription({
        entity: followee,
        prefix: messages.unlockedFollowGatedPrefix,
        suffix: messages.unlockedFollowGatedSuffix
      })
    }
    if (tippedUser) {
      return renderUnlockedSpecialAccessDescription({
        entity: tippedUser,
        prefix: messages.unlockedTipGatedPrefix,
        suffix: messages.unlockedTipGatedSuffix
      })
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [
    nftCollection,
    followee,
    tippedUser,
    handlePressCollection,
    renderUnlockedSpecialAccessDescription,
    styles
  ])

  if (isOwner) {
    return (
      <DetailsTileOwnerSection
        renderDescription={renderOwnerDescription}
        isCollectibleGated={!!nftCollection}
        style={style}
      />
    )
  }

  return (
    <DetailsTileUnlockedSection
      renderDescription={renderUnlockedDescription}
      style={style}
    />
  )
}
