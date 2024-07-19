import { useCallback } from 'react'

import { useStreamConditionsEntity } from '@audius/common/hooks'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type { AccessConditions, User } from '@audius/common/models'
import type { PurchaseableContentType } from '@audius/common/store'
import { formatPrice } from '@audius/common/utils'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'

import {
  Flex,
  IconCart,
  IconCollectible,
  IconSpecialAccess
} from '@audius/harmony-native'
import { LockedStatusBadge, Text, useLink } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const messages = {
  unlocked: 'UNLOCKED',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  payToUnlock: 'Pay to Unlock',
  unlockedCollectibleGatedPrefix: 'A Collectible from ',
  unlockedCollectibleGatedSuffix: (contentType: PurchaseableContentType) =>
    ` was found in a linked wallet. This ${contentType} is now available.`,
  ownerCollectibleGatedPrefix:
    'Users can unlock access by linking a wallet containing a collectible from ',
  unlockedFollowGatedPrefix: 'Thank you for following ',
  unlockedFollowGatedSuffix: (contentType: PurchaseableContentType) =>
    `! This ${contentType} is now available.`,
  ownerFollowGated: 'Users can unlock access by following your account!',
  unlockedTipGatedPrefix: 'Thank you for supporting ',
  unlockedTipGatedSuffix: (contentType: PurchaseableContentType) =>
    ` by sending them a tip! This ${contentType} is now available.`,
  ownerTipGated: 'Users can unlock access by sending you a tip!',
  unlockedUSDCPurchasePrefix: (contentType: PurchaseableContentType) =>
    `You've purchased this ${contentType}. Thank you for supporting `,
  unlockedUSDCPurchaseSuffix: '.',
  ownerUSDCPurchase: ({
    price,
    contentType
  }: {
    price: string
    contentType: PurchaseableContentType
  }) =>
    `Users can unlock access to this ${contentType} for a one time purchase of $${price}`
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    gap: spacing(2)
  },
  ownerTitleContainer: {
    justifyContent: 'flex-start'
  },
  title: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    color: palette.neutral,
    textTransform: 'uppercase'
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
    lineHeight: typography.fontSize.medium * 1.3
  },
  name: {
    color: palette.secondary
  }
}))

type HasAccessProps = {
  streamConditions: AccessConditions
  handlePressCollection: () => void
  contentType: PurchaseableContentType
}

const DetailsTileOwnerSection = ({
  streamConditions,
  handlePressCollection,
  contentType
}: HasAccessProps) => {
  const styles = useStyles()
  const neutral = useColor('neutral')

  if (isContentCollectibleGated(streamConditions)) {
    return (
      <Flex
        p='l'
        gap='s'
        backgroundColor='white'
        border='strong'
        borderRadius='m'
      >
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconCollectible fill={neutral} width={16} height={16} />
          <Text style={styles.title}>{messages.collectibleGated}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.ownerCollectibleGatedPrefix}
            </Text>
            <Text
              onPress={handlePressCollection}
              style={[styles.description, styles.name]}
            >
              {streamConditions.nft_collection?.name}
            </Text>
          </Text>
        </View>
      </Flex>
    )
  }
  if (
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions)
  ) {
    return (
      <Flex
        p='l'
        gap='s'
        backgroundColor='white'
        border='strong'
        borderRadius='m'
      >
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconSpecialAccess fill={neutral} width={16} height={16} />
          <Text style={styles.title}>{messages.specialAccess}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {isContentFollowGated(streamConditions)
                ? messages.ownerFollowGated
                : messages.ownerTipGated}
            </Text>
          </Text>
        </View>
      </Flex>
    )
  }
  if (isContentUSDCPurchaseGated(streamConditions)) {
    return (
      <Flex
        p='l'
        gap='s'
        backgroundColor='white'
        border='strong'
        borderRadius='m'
      >
        <View style={[styles.titleContainer, styles.ownerTitleContainer]}>
          <IconCart fill={neutral} width={16} height={16} />
          <Text style={styles.title}>{messages.payToUnlock}</Text>
        </View>
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.ownerUSDCPurchase({
                price: formatPrice(streamConditions.usdc_purchase.price),
                contentType
              })}
            </Text>
          </Text>
        </View>
      </Flex>
    )
  }
  return null
}

type DetailsTileHasAccessProps = {
  streamConditions: AccessConditions
  isOwner: boolean
  style?: ViewStyle
  trackArtist?: Pick<User, 'user_id' | 'name' | 'is_verified' | 'handle'>
  contentType: PurchaseableContentType
}

export const DetailsTileHasAccess = ({
  streamConditions,
  isOwner,
  style,
  trackArtist,
  contentType
}: DetailsTileHasAccessProps) => {
  const styles = useStyles()
  const navigation = useNavigation()

  const { nftCollection, collectionLink, followee, tippedUser } =
    useStreamConditionsEntity(streamConditions)

  const { onPress: handlePressCollection } = useLink(collectionLink)

  const handlePressArtistName = useCallback(
    (handle: string) => () => {
      navigation.push('Profile', { handle })
    },
    [navigation]
  )

  const renderUnlockedSpecialAccessDescription = useCallback(
    (args: {
      entity: Pick<User, 'user_id' | 'name' | 'is_verified' | 'handle'>
      prefix: string
      suffix: string
    }) => {
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
    if (isContentCollectibleGated(streamConditions)) {
      if (!nftCollection) return null
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
              {messages.unlockedCollectibleGatedSuffix(contentType)}
            </Text>
          </Text>
        </View>
      )
    }
    if (isContentFollowGated(streamConditions)) {
      if (!followee) return null
      return renderUnlockedSpecialAccessDescription({
        entity: followee,
        prefix: messages.unlockedFollowGatedPrefix,
        suffix: messages.unlockedFollowGatedSuffix(contentType)
      })
    }
    if (isContentTipGated(streamConditions)) {
      if (!tippedUser) return null
      return renderUnlockedSpecialAccessDescription({
        entity: tippedUser,
        prefix: messages.unlockedTipGatedPrefix,
        suffix: messages.unlockedTipGatedSuffix(contentType)
      })
    }
    if (isContentUSDCPurchaseGated(streamConditions)) {
      if (!trackArtist) return null
      return renderUnlockedSpecialAccessDescription({
        entity: trackArtist,
        prefix: messages.unlockedUSDCPurchasePrefix(contentType),
        suffix: messages.unlockedUSDCPurchaseSuffix
      })
    }
    return null
  }, [
    streamConditions,
    nftCollection,
    styles.descriptionContainer,
    styles.description,
    styles.name,
    handlePressCollection,
    followee,
    renderUnlockedSpecialAccessDescription,
    tippedUser,
    trackArtist,
    contentType
  ])

  if (isOwner) {
    return (
      <DetailsTileOwnerSection
        streamConditions={streamConditions}
        handlePressCollection={handlePressCollection}
        contentType={contentType}
      />
    )
  }

  return (
    <Flex
      p='l'
      gap='s'
      backgroundColor='white'
      border='strong'
      borderRadius='m'
      style={style}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{messages.unlocked}</Text>
        <LockedStatusBadge
          locked={false}
          variant={
            isContentUSDCPurchaseGated(streamConditions) ? 'purchase' : 'gated'
          }
        />
      </View>
      {renderUnlockedDescription()}
    </Flex>
  )
}
