import { useCallback, useEffect } from 'react'

import type { StringWei, CommonState } from '@audius/common'
import {
  tokenDashboardPageActions,
  StringKeys,
  vipDiscordModalActions,
  formatWei,
  tokenDashboardPageSelectors,
  walletSelectors,
  walletActions,
  getTierAndNumberForBalance,
  modalsActions,
  isNullOrUndefined
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { Image, Linking, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import { IconCrown } from '@audius/harmony-native'
import { IconDiscord } from '@audius/harmony-native'
import { IconInfo } from '@audius/harmony-native'
import { IconReceive } from '@audius/harmony-native'
import { IconSend } from '@audius/harmony-native'
import { IconWallet } from '@audius/harmony-native'
import Bronze from 'app/assets/images/tokenBadgeBronze108.png'
import Gold from 'app/assets/images/tokenBadgeGold108.png'
import Platinum from 'app/assets/images/tokenBadgePlatinum108.png'
import Silver from 'app/assets/images/tokenBadgeSilver108.png'
import TokenStill from 'app/assets/images/tokenSpinStill.png'
import {
  ScrollView,
  Screen,
  Button,
  GradientText,
  Text,
  Tile,
  ScreenContent
} from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ChallengeRewards } from './ChallengeRewards'
import { Tier } from './Tier'
import { TrendingRewards } from './TrendingRewards'
const { setVisibility } = modalsActions
const { getBalance } = walletActions
const { getAccountTotalBalance, getTotalBalanceLoadDidFail } = walletSelectors
const { getHasAssociatedWallets } = tokenDashboardPageSelectors
const { fetchAssociatedWallets } = tokenDashboardPageActions
const { pressDiscord } = vipDiscordModalActions

const LEARN_MORE_LINK = 'https://blog.audius.co/article/community-meet-audio'

const messages = {
  title: '$AUDIO & Rewards',
  audio: '$AUDIO',
  send: 'Send $AUDIO',
  receive: 'Receive $AUDIO',
  manageWallet: 'Manage Wallets',
  rewards: 'Earn Rewards',
  rewardsBody1: 'Complete tasks to earn $AUDIO tokens!',
  trending: 'Trending Competitions',
  trendingBody1: 'Win contests to earn $AUDIO tokens!',
  vipTiers: '$AUDIO VIP Tiers',
  vipTiersBody1: 'Unlock $AUDIO VIP Tiers by simply holding more $AUDIO!',
  vipTiersBody2:
    'Advancing to a new tier will earn your profile a badge, visible throughout the app, and unlock various new features as they are released.',
  launchDiscord: 'Launch the VIP Discord',
  what: 'What is $AUDIO',
  whatBody1:
    'Audius is owned by people like you, not major corporations. Holding $AUDIO grants you partial ownership of the Audius platform and gives you access to special features as they are released.',
  learnMore: 'Learn More',
  whatBody2: `Still confused? Don't worry, more details coming soon!`
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  tiles: {
    height: '100%'
  },
  tileRoot: {
    margin: spacing(3)
  },
  tile: {
    borderRadius: 6,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(4)
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileHeader: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.xxxxl,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16
  },
  tileSubheader: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(5),
    textAlign: 'center',
    marginBottom: spacing(6)
  },
  tileLink: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.medium,
    color: palette.secondary,
    lineHeight: spacing(5),
    textAlign: 'center',
    marginVertical: spacing(4)
  },
  audioAmount: {
    color: palette.staticWhite,
    fontSize: typography.fontSize.xxxxxl,
    fontFamily: typography.fontByWeight.heavy,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15
  },
  audioAmountContainer: {
    marginTop: spacing(4),
    marginBottom: spacing(2)
  },
  spinner: {
    width: spacing(16),
    height: spacing(16),
    marginBottom: spacing(3.5)
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  audioText: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.bold,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
    textTransform: 'uppercase',
    marginRight: spacing(1)
  },
  buttonRoot: {
    marginTop: spacing(2),
    marginBottom: spacing(2),
    height: spacing(12),
    width: 260
  },
  button: {
    paddingHorizontal: spacing(2)
  },
  buttonText: {
    padding: 0,
    textTransform: 'uppercase'
  },
  token: {
    width: 200,
    height: 200,
    marginBottom: spacing(6)
  },
  noticeTile: {
    padding: spacing(2)
  },
  noticeTileText: {
    color: palette.staticWhite
  }
}))

export const AudioScreen = () => {
  const styles = useStyles()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { toast } = useToast()
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  const totalBalance = useSelector(getAccountTotalBalance)
  const balanceLoadDidFail = useSelector(getTotalBalanceLoadDidFail)

  const totalBalanceWei =
    useSelector((state: CommonState) => state.wallet.totalBalance) ??
    ('0' as StringWei)

  const { tierNumber } = getTierAndNumberForBalance(totalBalanceWei)

  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

  const handlePressWalletInfo = useCallback(() => {
    dispatch(setVisibility({ modal: 'AudioBreakdown', visible: true }))
  }, [dispatch])

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

  const renderAudioTile = () => {
    return (
      <Tile
        as={LinearGradient}
        colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
        onPress={hasMultipleWallets ? handlePressWalletInfo : undefined}
      >
        <View style={styles.audioAmountContainer}>
          {isNullOrUndefined(totalBalance) ? (
            <LoadingSpinner
              fill={'rgba(255, 255, 255, 0.75)'}
              style={styles.spinner}
            />
          ) : (
            <Text style={styles.audioAmount}>
              {formatWei(totalBalance, true, 0)}{' '}
            </Text>
          )}
        </View>
        <View style={styles.audioInfo}>
          {hasMultipleWallets ? (
            <>
              <Text style={styles.audioText}>{messages.audio}</Text>
              <IconInfo height={16} width={16} fill={'rgba(255,255,255,0.5)'} />
            </>
          ) : (
            <Text style={styles.audioText}>{messages.audio}</Text>
          )}
        </View>
      </Tile>
    )
  }

  const handlePressSend = useCallback(() => {
    dispatch(
      setVisibility({ modal: 'TransferAudioMobileWarning', visible: true })
    )
  }, [dispatch])

  const handlePressReceive = useCallback(() => {
    dispatch(
      setVisibility({ modal: 'TransferAudioMobileWarning', visible: true })
    )
  }, [dispatch])

  const handlePressManageWallets = useCallback(() => {
    navigation.navigate('WalletConnect')
  }, [navigation])

  const renderWalletTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
      >
        <Button
          title={messages.send}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          iconPosition='left'
          size='medium'
          icon={IconSend}
          onPress={handlePressSend}
        />
        <Button
          title={messages.receive}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          iconPosition='left'
          size='medium'
          icon={IconReceive}
          onPress={handlePressReceive}
        />
        <Button
          title={messages.manageWallet}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          iconPosition='left'
          size='medium'
          icon={IconWallet}
          onPress={handlePressManageWallets}
        />
      </Tile>
    )
  }

  const renderRewardsTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
      >
        <GradientText style={styles.tileHeader}>
          {messages.rewards}
        </GradientText>
        <Text style={styles.tileSubheader}>{messages.rewardsBody1}</Text>
        <ChallengeRewards />
      </Tile>
    )
  }

  const renderTrendingTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
      >
        <GradientText style={styles.tileHeader}>
          {messages.trending}
        </GradientText>
        <Text style={styles.tileSubheader}>{messages.trendingBody1}</Text>
        <TrendingRewards />
      </Tile>
    )
  }

  const onPressLaunchDiscord = useCallback(() => {
    dispatch(pressDiscord())
  }, [dispatch])

  const renderTierTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
      >
        <GradientText style={styles.tileHeader}>
          {messages.vipTiers}
        </GradientText>
        <Text style={styles.tileSubheader}>{messages.vipTiersBody1}</Text>
        <Text style={styles.tileSubheader}>{messages.vipTiersBody2}</Text>
        <Tier
          tierNumber={1}
          title='bronze'
          colors={['rgba(141, 48, 8, 0.5)', 'rgb(182, 97, 11)']}
          minAmount={10}
          image={<Image source={Bronze} />}
          isCurrentTier={tierNumber === 1}
        />
        <Tier
          tierNumber={2}
          title='silver'
          colors={['rgba(179, 182, 185, 0.5)', 'rgb(189, 189, 189)']}
          minAmount={100}
          image={<Image source={Silver} />}
          isCurrentTier={tierNumber === 2}
        />
        <Tier
          tierNumber={3}
          title='gold'
          colors={['rgb(236, 173, 11)', 'rgb(236, 173, 11)']}
          minAmount={10000}
          image={<Image source={Gold} />}
          isCurrentTier={tierNumber === 3}
        />
        <Tier
          tierNumber={4}
          title='platinum'
          colors={['rgb(179, 236, 249)', 'rgb(87, 194, 215)']}
          minAmount={100000}
          image={<Image source={Platinum} />}
          isCurrentTier={tierNumber === 4}
        />
        <Button
          title={messages.learnMore}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          size='medium'
          onPress={() => Linking.openURL(LEARN_MORE_LINK)}
          fullWidth
        />
        <Button
          title={messages.launchDiscord}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          size='medium'
          iconPosition='left'
          icon={IconDiscord}
          onPress={onPressLaunchDiscord}
        />
      </Tile>
    )
  }

  const renderWhatTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}
      >
        <Image style={styles.token} source={TokenStill} />
        <GradientText style={styles.tileHeader}>{messages.what}</GradientText>
        <Text style={styles.tileSubheader}>{messages.whatBody1}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(LEARN_MORE_LINK)}
          activeOpacity={0.7}
        >
          <Text style={styles.tileLink}>{messages.learnMore}</Text>
        </TouchableOpacity>
        <Text style={styles.tileSubheader}>{messages.whatBody2}</Text>
      </Tile>
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
          {audioFeaturesDegradedText ? renderNoticeTile() : null}
          {renderAudioTile()}
          {renderWalletTile()}
          {renderRewardsTile()}
          {renderTrendingTile()}
          {renderTierTile()}
          {renderWhatTile()}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
