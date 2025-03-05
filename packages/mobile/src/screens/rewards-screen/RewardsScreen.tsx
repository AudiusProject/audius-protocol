import { useCallback, useEffect } from 'react'

import type { StringWei } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  tokenDashboardPageActions,
  walletSelectors,
  walletActions,
  getTierAndNumberForBalance,
  vipDiscordModalActions
} from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { Linking } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import {
  Button,
  Flex,
  IconCrown,
  IconDiscord,
  Paper,
  Text
} from '@audius/harmony-native'
import Bronze from 'app/assets/images/tokenBadgeBronze108.png'
import Gold from 'app/assets/images/tokenBadgeGold108.png'
import Platinum from 'app/assets/images/tokenBadgePlatinum108.png'
import Silver from 'app/assets/images/tokenBadgeSilver108.png'
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
import { Tier } from './Tier'
import { TrendingRewardsTile } from './TrendingRewardsTile'

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
  learnMore: 'Learn More'
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
  const { tierNumber } = getTierAndNumberForBalance(totalBalanceWei)

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
        <Tier
          tierNumber={1}
          title='bronze'
          gradientColors={['rgba(141, 48, 8, 0.5)', 'rgb(182, 97, 11)']}
          minAmount={10}
          imageSource={Bronze}
          isCurrentTier={tierNumber === 1}
        />
        <Tier
          tierNumber={2}
          title='silver'
          gradientColors={['rgba(179, 182, 185, 0.5)', 'rgb(189, 189, 189)']}
          minAmount={100}
          imageSource={Silver}
          isCurrentTier={tierNumber === 2}
        />
        <Tier
          tierNumber={3}
          title='gold'
          gradientColors={['rgb(236, 173, 11)', 'rgb(236, 173, 11)']}
          minAmount={1000}
          imageSource={Gold}
          isCurrentTier={tierNumber === 3}
          unlocks={['matrix']}
        />
        <Tier
          tierNumber={4}
          title='platinum'
          gradientColors={['rgb(179, 236, 249)', 'rgb(87, 194, 215)']}
          minAmount={10000}
          imageSource={Platinum}
          isCurrentTier={tierNumber === 4}
          unlocks={['matrix']}
        />
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
