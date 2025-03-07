import type { ReactElement } from 'react'
import React, { useCallback, useEffect } from 'react'

import type { StringWei, BadgeTier } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  badgeTiers,
  tokenDashboardPageActions,
  walletSelectors,
  walletActions,
  getTierAndNumberForBalance,
  vipDiscordModalActions
} from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { formatNumberCommas } from '@audius/common/utils'
import { useFocusEffect } from '@react-navigation/native'
import { Linking } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import {
  Button,
  Flex,
  IconCrown,
  IconDiscord,
  IconValidationCheck,
  Paper,
  Text,
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver
} from '@audius/harmony-native'
import {
  ScrollView,
  Screen,
  Tile,
  ScreenContent,
  GradientText
} from 'app/components/core'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ChallengeRewardsTile } from './ChallengeRewardsTile'
import { ClaimAllRewardsTile } from './ClaimAllRewardsTile'
import { TrendingRewardsTile } from './TrendingRewardsTile'

// Define features and featureMessages
const features = [
  'balance',
  'hqStreaming',
  'unlimitedUploads',
  'uploadOnMobile',
  'offlineListening',
  'gatedContent',
  'directMessaging',
  'nftGallery',
  'messageBlasts',
  'flairBadges',
  'customDiscordRole',
  'customThemes'
] as const

type FeatureKey = (typeof features)[number]

const featureMessages: Record<FeatureKey, string> = {
  balance: '$AUDIO Balance',
  hqStreaming: 'HQ Streaming',
  unlimitedUploads: 'Unlimited Uploads',
  uploadOnMobile: 'Upload on Mobile',
  offlineListening: 'Offline Listening',
  gatedContent: 'Gated Content',
  directMessaging: 'Direct Messaging',
  nftGallery: 'NFT Collectibles Gallery',
  messageBlasts: 'Message Blasts',
  flairBadges: 'Flair Badges',
  customDiscordRole: 'Custom Discord Role',
  customThemes: 'App Themes'
}

const tierFeatureMap: Record<BadgeTier, Record<FeatureKey, boolean>> = {
  none: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: false,
    flairBadges: false,
    customDiscordRole: false,
    customThemes: false
  },
  bronze: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: false
  },
  silver: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: false
  },
  gold: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: true
  },
  platinum: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: true
  }
}

type AudioTiers = Exclude<BadgeTier, 'none'>

const audioTierMapSvg: {
  [tier in AudioTiers]: Nullable<ReactElement>
} = {
  bronze: <IconTokenBronze size='l' />,
  silver: <IconTokenSilver size='l' />,
  gold: <IconTokenGold size='l' />,
  platinum: <IconTokenPlatinum size='l' />
}

const { getBalance } = walletActions
const { getTotalBalanceLoadDidFail } = walletSelectors
const { fetchAssociatedWallets } = tokenDashboardPageActions
const { pressDiscord } = vipDiscordModalActions

const LEARN_MORE_LINK = 'https://blog.audius.co/article/community-meet-audio'

const messages = {
  title: 'Rewards & Perks',
  rewards: 'Earn Rewards',
  rewardsBody1: 'Complete tasks to earn $AUDIO tokens!',
  vipTiers: 'Reward Perks',
  vipTiersBody:
    'Keep $AUDIO in your wallet to enjoy perks and exclusive features.',
  launchDiscord: 'Launch the VIP Discord',
  what: 'What is $AUDIO',
  learnMore: 'LEARN MORE'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  tiles: {
    height: '100%',
    padding: spacing(3)
  },
  tile: {
    borderRadius: 6,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(4)
  },
  tileRoot: {
    margin: spacing(3),
    padding: spacing(3)
  },
  tileHeader: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.xxl
  },
  tileSubheader: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(5),
    textAlign: 'center',
    marginBottom: spacing(6)
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200
  },
  noticeTile: {
    padding: spacing(2)
  },
  noticeTileText: {
    color: palette.inverse
  }
}))

export const RewardsScreen = () => {
  const styles = useStyles()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  const totalBalanceWei =
    useSelector((state: CommonState) => state.wallet.totalBalance) ??
    ('0' as StringWei)
  const balanceLoadDidFail = useSelector(getTotalBalanceLoadDidFail)
  const { tier } = getTierAndNumberForBalance(totalBalanceWei)

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchAssociatedWallets())
      dispatch(getBalance())
    }, [dispatch])
  )

  useEffect(() => {
    if (balanceLoadDidFail) {
      toast({
        content: 'Balance failed to load. Please try again later.',
        type: 'error',
        timeout: 10000
      })
    }
  }, [balanceLoadDidFail, toast])

  const renderNoticeTile = () => (
    <Tile
      as={LinearGradient}
      colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      styles={{
        root: styles.tileRoot,
        tile: styles.noticeTile,
        content: styles.tileContent
      }}
    >
      <Text style={styles.noticeTileText}>{audioFeaturesDegradedText}</Text>
    </Tile>
  )

  const onPressLaunchDiscord = useCallback(() => {
    dispatch(pressDiscord())
  }, [dispatch])

  const renderTierTile = () => {
    return (
      <Paper
        shadow='near'
        border='strong'
        ph='s'
        pv='xl'
        alignItems='center'
        gap='l'
      >
        <GradientText style={styles.tileHeader}>
          {messages.vipTiers}
        </GradientText>
        <Flex ph='2xl'>
          <Text variant='body' textAlign='center'>
            {messages.vipTiersBody}
          </Text>
        </Flex>

        <Paper
          shadow='mid'
          border='strong'
          style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 8
          }}
        >
          {/* Current tier header */}
          <LinearGradient
            colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={{ padding: 12 }}
          >
            <Flex justifyContent='center' alignItems='center'>
              <Text variant='label' size='s' color='white'>
                CURRENT TIER
              </Text>
            </Flex>
          </LinearGradient>

          {/* Tier icon and name */}
          <Flex direction='column' alignItems='center' gap='s' pv='l' ph='l'>
            {tier === 'none' ? (
              <Text variant='title' size='l'>
                No Tier
              </Text>
            ) : (
              <>
                {audioTierMapSvg[tier as AudioTiers]}
                <GradientText
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                >
                  {tier}
                </GradientText>
              </>
            )}
          </Flex>

          {/* Feature rows */}
          {features.map((feature) => {
            const isAvailable = tierFeatureMap[tier][feature]
            let content: React.ReactNode = null

            if (feature === 'balance') {
              if (tier === 'none') {
                return null
              }
              const minAudio = badgeTiers
                .find((b) => b.tier === tier)
                ?.minAudio.toString()
              if (!minAudio) return null

              content = (
                <Text variant='label' size='m'>
                  {`${formatNumberCommas(minAudio)}+`}
                </Text>
              )
            } else if (isAvailable) {
              content = (
                <Flex direction='row' alignItems='center' gap='s'>
                  <IconValidationCheck />
                  {feature === 'customDiscordRole' ? (
                    <Button
                      size='small'
                      variant='secondary'
                      iconLeft={IconDiscord}
                      onPress={onPressLaunchDiscord}
                    />
                  ) : null}
                </Flex>
              )
            } else {
              // No content for unavailable features - empty circle was removed in mobile web
              return null
            }

            return (
              <Flex
                key={feature}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                pv='m'
                ph='m'
                borderTop='default'
              >
                <Text variant='body'>{featureMessages[feature]}</Text>
                {content}
              </Flex>
            )
          })}
        </Paper>

        <Flex gap='l' w='100%'>
          <Button
            variant='secondary'
            onPress={() => Linking.openURL(LEARN_MORE_LINK)}
            fullWidth
          >
            {messages.learnMore}
          </Button>
          <Button
            variant='secondary'
            iconLeft={IconDiscord}
            onPress={onPressLaunchDiscord}
            fullWidth
          >
            {messages.launchDiscord}
          </Button>
        </Flex>
      </Paper>
    )
  }

  return (
    <Screen
      url='/audio'
      variant='secondary'
      icon={IconCrown}
      title={messages.title}
    >
      <ScreenContent>
        <ScrollView style={styles.tiles}>
          <Flex gap='xl'>
            {audioFeaturesDegradedText ? renderNoticeTile() : null}
            <ClaimAllRewardsTile />
            <ChallengeRewardsTile />
            <TrendingRewardsTile />
            {renderTierTile()}
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
