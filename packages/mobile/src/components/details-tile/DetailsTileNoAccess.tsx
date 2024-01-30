import type { ReactNode } from 'react'
import { useCallback } from 'react'

import {
  gatedContentSelectors,
  tippingActions,
  usePremiumContentPurchaseModal,
  usersSocialActions
} from '@audius/common'
import { useStreamConditionsEntity } from '@audius/common/hooks'
import {
  FollowSource,
  ModalSource,
  Chain,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type { ID, AccessConditions, User } from '@audius/common/models'
import { formatPrice } from '@audius/common/utils'
import type { ViewStyle } from 'react-native'
import { Image, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconExternalLink from 'app/assets/images/iconExternalLink.svg'
import IconFollow from 'app/assets/images/iconFollow.svg'
import IconTip from 'app/assets/images/iconTip.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import { Button, LockedStatusBadge, useLink } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import UserBadges from 'app/components/user-badges'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { getGatedTrackStatusMap } = gatedContentSelectors
const { followUser } = usersSocialActions
const { beginTip } = tippingActions

const messages = {
  unlocking: 'UNLOCKING',
  howToUnlock: 'HOW TO UNLOCK',
  goToCollection: 'Go To Collection',
  followArtist: 'Follow Artist',
  sendTip: 'Send Tip',
  buy: (price: string) => `Buy $${price}`,
  lockedCollectibleGated:
    'To unlock this track, you must link a wallet containing a collectible from:',
  unlockingCollectibleGatedPrefix: 'A Collectible from ',
  unlockingCollectibleGatedSuffix: ' was found in a linked wallet.',
  lockedFollowGatedPrefix: 'Follow ',
  unlockingFollowGatedPrefix: 'Thank you for following ',
  unlockingFollowGatedSuffix: '!',
  lockedTipGatedPrefix: 'Send ',
  lockedTipGatedSuffix: ' a tip.',
  unlockingTipGatedPrefix: 'Thank you for supporting ',
  unlockingTipGatedSuffix: ' by sending them a tip!',
  lockedUSDCPurchase: 'Unlock access with a one-time purchase!'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    padding: spacing(2),
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2),
    gap: spacing(2),
    width: '100%'
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'space-between'
  },
  title: {
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
    lineHeight: typography.fontSize.medium * 1.3
  },
  name: {
    color: palette.secondary
  },
  collectionContainer: {
    ...flexRowCentered(),
    marginTop: spacing(2),
    gap: spacing(6)
  },
  collectionImages: {
    ...flexRowCentered()
  },
  collectionImage: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(1),
    width: spacing(8),
    height: spacing(8)
  },
  collectionChainImageContainer: {
    backgroundColor: palette.white,
    position: 'absolute',
    left: spacing(6),
    padding: spacing(1),
    width: spacing(6),
    height: spacing(6),
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(4)
  },
  collectionChainImage: {
    top: -spacing(0.25),
    left: -spacing(1.25)
  },
  mainButton: {
    marginTop: spacing(3),
    backgroundColor: palette.accentBlue
  },
  buyButton: {
    backgroundColor: palette.specialLightGreen
  },
  loadingSpinner: {
    width: spacing(5),
    height: spacing(5)
  }
}))

type NoAccessProps = {
  renderDescription: () => ReactNode
  streamConditions: AccessConditions
  isUnlocking: boolean
  style?: ViewStyle
}

const DetailsTileNoAccessSection = ({
  renderDescription,
  streamConditions,
  isUnlocking,
  style
}: NoAccessProps) => {
  const styles = useStyles()

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {isUnlocking ? messages.unlocking : messages.howToUnlock}
        </Text>
        {isUnlocking ? (
          <LoadingSpinner style={styles.loadingSpinner} />
        ) : (
          <LockedStatusBadge
            locked={true}
            variant={
              isContentUSDCPurchaseGated(streamConditions)
                ? 'purchase'
                : 'gated'
            }
          />
        )}
      </View>
      {renderDescription()}
    </View>
  )
}

type DetailsTileNoAccessProps = {
  streamConditions: AccessConditions
  trackId: ID
  style?: ViewStyle
}

export const DetailsTileNoAccess = ({
  trackId,
  streamConditions,
  style
}: DetailsTileNoAccessProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { isOpen: isModalOpen } = useDrawer('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const source = isModalOpen ? 'howToUnlockModal' : 'howToUnlockTrackPage'
  const followSource = isModalOpen
    ? FollowSource.HOW_TO_UNLOCK_MODAL
    : FollowSource.HOW_TO_UNLOCK_TRACK_PAGE
  const gatedTrackStatusMap = useSelector(getGatedTrackStatusMap)
  const gatedTrackStatus = gatedTrackStatusMap[trackId] ?? null
  const { nftCollection, collectionLink, followee, tippedUser } =
    useStreamConditionsEntity(streamConditions)

  const { onPress: handlePressCollection } = useLink(collectionLink)

  const handleFollowArtist = useCallback(() => {
    if (followee) {
      dispatch(followUser(followee.user_id, followSource, trackId))
    }
  }, [followee, dispatch, followSource, trackId])

  const handleSendTip = useCallback(() => {
    dispatch(beginTip({ user: tippedUser, source, trackId }))
    navigation.navigate('TipArtist')
  }, [tippedUser, navigation, dispatch, source, trackId])

  const handlePurchasePress = useCallback(() => {
    openPremiumContentPurchaseModal(
      { contentId: trackId },
      { source: ModalSource.TrackDetails }
    )
  }, [trackId, openPremiumContentPurchaseModal])

  const handlePressArtistName = useCallback(
    (handle: string) => () => {
      navigation.push('Profile', { handle })
    },
    [navigation]
  )

  const renderLockedSpecialAccessDescription = useCallback(
    (args: { entity: User; prefix: string; suffix?: string }) => {
      const { entity, prefix, suffix } = args
      return (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{prefix}</Text>
          <Text
            style={[styles.description, styles.name]}
            onPress={handlePressArtistName(entity.handle)}
          >
            {entity.name}
          </Text>
          <UserBadges
            badgeSize={spacing(4)}
            user={entity}
            nameStyle={styles.description}
            hideName
          />
          {suffix ? <Text style={styles.description}>{suffix}</Text> : null}
        </View>
      )
    },
    [styles, handlePressArtistName]
  )

  const renderLockedDescription = useCallback(() => {
    if (isContentCollectibleGated(streamConditions)) {
      if (!nftCollection) return null
      return (
        <>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {messages.lockedCollectibleGated}
            </Text>
            <View style={styles.collectionContainer}>
              {nftCollection.imageUrl && (
                <View style={styles.collectionImages}>
                  <Image
                    source={{ uri: nftCollection.imageUrl }}
                    style={styles.collectionImage}
                  />
                  <View style={styles.collectionChainImageContainer}>
                    {nftCollection.chain === Chain.Eth ? (
                      <LogoEth
                        style={styles.collectionChainImage}
                        height={spacing(4)}
                      />
                    ) : (
                      <LogoSol
                        style={styles.collectionChainImage}
                        height={spacing(4)}
                      />
                    )}
                  </View>
                </View>
              )}
              <Text style={styles.description}>{nftCollection.name}</Text>
            </View>
          </View>
          <Button
            style={styles.mainButton}
            styles={{ icon: { width: spacing(4), height: spacing(4) } }}
            title={messages.goToCollection}
            size='large'
            iconPosition='right'
            icon={IconExternalLink}
            onPress={handlePressCollection}
            fullWidth
          />
        </>
      )
    }
    if (isContentFollowGated(streamConditions)) {
      if (!followee) return null
      return (
        <>
          {renderLockedSpecialAccessDescription({
            entity: followee,
            prefix: messages.lockedFollowGatedPrefix
          })}
          <Button
            style={styles.mainButton}
            styles={{ icon: { width: spacing(4), height: spacing(4) } }}
            title={messages.followArtist}
            size='large'
            iconPosition='left'
            icon={IconFollow}
            onPress={handleFollowArtist}
            fullWidth
          />
        </>
      )
    }
    if (isContentTipGated(streamConditions)) {
      if (!tippedUser) return null
      return (
        <>
          {renderLockedSpecialAccessDescription({
            entity: tippedUser,
            prefix: messages.lockedTipGatedPrefix,
            suffix: messages.lockedTipGatedSuffix
          })}
          <Button
            style={styles.mainButton}
            styles={{ icon: { width: spacing(4), height: spacing(4) } }}
            title={messages.sendTip}
            size='large'
            iconPosition='right'
            icon={IconTip}
            onPress={handleSendTip}
            fullWidth
          />
        </>
      )
    }
    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {messages.lockedUSDCPurchase}
            </Text>
          </View>
          <Button
            style={[styles.mainButton, styles.buyButton]}
            styles={{ icon: { width: spacing(4), height: spacing(4) } }}
            title={messages.buy(
              formatPrice(streamConditions.usdc_purchase.price)
            )}
            size='large'
            onPress={handlePurchasePress}
            fullWidth
          />
        </>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }, [
    streamConditions,
    nftCollection,
    styles.descriptionContainer,
    styles.description,
    styles.collectionContainer,
    styles.collectionImages,
    styles.collectionImage,
    styles.collectionChainImageContainer,
    styles.collectionChainImage,
    styles.mainButton,
    styles.buyButton,
    handlePressCollection,
    followee,
    renderLockedSpecialAccessDescription,
    handleFollowArtist,
    tippedUser,
    handleSendTip,
    handlePurchasePress
  ])

  const renderUnlockingSpecialAccessDescription = useCallback(
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
              badgeSize={spacing(4)}
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

  const renderUnlockingDescription = useCallback(() => {
    if (nftCollection) {
      return (
        <View style={styles.descriptionContainer}>
          <Text>
            <Text style={styles.description}>
              {messages.unlockingCollectibleGatedPrefix}
            </Text>
            <Text
              onPress={handlePressCollection}
              style={[styles.description, styles.name]}
            >
              {nftCollection.name}
            </Text>
            <Text style={styles.description}>
              {messages.unlockingCollectibleGatedSuffix}
            </Text>
          </Text>
        </View>
      )
    }
    if (followee) {
      return renderUnlockingSpecialAccessDescription({
        entity: followee,
        prefix: messages.unlockingFollowGatedPrefix,
        suffix: messages.unlockingFollowGatedSuffix
      })
    }
    if (tippedUser) {
      return renderUnlockingSpecialAccessDescription({
        entity: tippedUser,
        prefix: messages.unlockingTipGatedPrefix,
        suffix: messages.unlockingTipGatedSuffix
      })
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }, [
    nftCollection,
    followee,
    tippedUser,
    handlePressCollection,
    renderUnlockingSpecialAccessDescription,
    styles
  ])

  const isUnlocking = gatedTrackStatus === 'UNLOCKING'

  return (
    <DetailsTileNoAccessSection
      renderDescription={
        isUnlocking ? renderUnlockingDescription : renderLockedDescription
      }
      streamConditions={streamConditions}
      isUnlocking={isUnlocking}
      style={style}
    />
  )
}
