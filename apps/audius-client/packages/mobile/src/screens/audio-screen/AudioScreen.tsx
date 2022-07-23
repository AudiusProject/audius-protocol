import { useCallback } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import { BNWei, StringWei } from 'audius-client/src/common/models/Wallet'
import { getHasAssociatedWallets } from 'audius-client/src/common/store/pages/token-dashboard/selectors'
import {
  setModalState,
  setModalVisibility
} from 'audius-client/src/common/store/pages/token-dashboard/slice'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { getAccountTotalBalance } from 'audius-client/src/common/store/wallet/selectors'
import { getBalance } from 'audius-client/src/common/store/wallet/slice'
import { getTierAndNumberForBalance } from 'audius-client/src/common/store/wallet/utils'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { formatWei } from 'audius-client/src/common/utils/wallet'
import BN from 'bn.js'
import { Image, Linking, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'

import IconDiscord from 'app/assets/images/iconDiscord.svg'
import IconInfo from 'app/assets/images/iconInfo.svg'
import IconReceive from 'app/assets/images/iconReceive.svg'
import IconSend from 'app/assets/images/iconSend.svg'
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
  Tile
} from 'app/components/core'
import { Header } from 'app/components/header'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ChallengeRewards } from './ChallengeRewards'
import { Tier } from './Tier'
import { TrendingRewards } from './TrendingRewards'

const LEARN_MORE_LINK = 'https://blog.audius.co/article/community-meet-audio'

const messages = {
  title: '$AUDIO & Rewards',
  audio: '$AUDIO',
  totalAudio: 'Total $AUDIO',
  send: 'Send $AUDIO',
  receive: 'Receive $AUDIO',
  connect: 'Connect Other Wallets',
  rewards: '$AUDIO Rewards',
  rewardsBody1: 'Complete tasks to earn $AUDIO tokens!',
  rewardsBody2:
    'Opportunities to earn $AUDIO will change, so check back often for more chances to earn!',
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
    fontFamiy: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.xxxxl,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16
  },
  tileSubheader: {
    fontFamiy: typography.fontByWeight.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: spacing(5),
    textAlign: 'center'
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
    marginTop: spacing(4),
    color: palette.staticWhite,
    fontSize: typography.fontSize.xxxxxl,
    fontFamily: typography.fontByWeight.heavy,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15
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
  }
}))

export const AudioScreen = () => {
  const styles = useStyles()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const dispatchWeb = useDispatchWeb()

  const totalBalance: Nullable<BNWei> =
    useSelectorWeb(getAccountTotalBalance) ?? null

  const totalBalanceWei =
    useSelectorWeb((state) => state.wallet.totalBalance) ?? ('0' as StringWei)

  const { tierNumber } = getTierAndNumberForBalance(totalBalanceWei)

  const hasMultipleWallets = useSelectorWeb(getHasAssociatedWallets)

  const onPressWalletInfo = useCallback(() => {
    dispatchWeb(setVisibility({ modal: 'AudioBreakdown', visible: true }))
  }, [dispatchWeb])

  useFocusEffect(
    useCallback(() => {
      dispatchWeb(getBalance())
    }, [dispatchWeb])
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
        }}>
        <Text style={styles.audioAmount}>
          {formatWei((totalBalance || new BN(0)) as BNWei, true, 0)}{' '}
        </Text>
        <View style={styles.audioInfo}>
          {hasMultipleWallets ? (
            <>
              <Text style={styles.audioText}>{messages.totalAudio}</Text>
              <TouchableOpacity
                hitSlop={{ left: 4, top: 4, bottom: 4, right: 4 }}
                onPress={onPressWalletInfo}
                activeOpacity={0.7}>
                <IconInfo
                  height={16}
                  width={16}
                  fill={'rgba(255,255,255,0.5)'}
                />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.audioText}>{messages.audio}</Text>
          )}
        </View>
      </Tile>
    )
  }

  const onPressSend = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: 'TransferAudioMobileWarning', visible: true })
    )
  }, [dispatchWeb])

  const onPressReceive = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: 'TransferAudioMobileWarning', visible: true })
    )
  }, [dispatchWeb])

  const onPressConnectWallets = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: 'MobileConnectWalletsDrawer', visible: true })
    )
  }, [dispatchWeb])

  const renderWalletTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}>
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
          onPress={onPressSend}
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
          onPress={onPressReceive}
        />
        <Button
          title={messages.connect}
          styles={{
            root: styles.buttonRoot,
            text: styles.buttonText,
            button: styles.button
          }}
          variant='commonAlt'
          size='medium'
          onPress={onPressConnectWallets}
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
        }}>
        <GradientText style={styles.tileHeader}>
          {messages.rewards}
        </GradientText>
        <Text style={styles.tileSubheader}>{messages.rewardsBody1}</Text>
        <Text style={styles.tileSubheader}>{messages.rewardsBody2}</Text>
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
        }}>
        <GradientText style={styles.tileHeader}>
          {messages.trending}
        </GradientText>
        <Text style={styles.tileSubheader}>{messages.trendingBody1}</Text>
        <TrendingRewards />
      </Tile>
    )
  }

  const onPressLaunchDiscord = useCallback(() => {
    dispatchWeb(setModalState({ modalState: { stage: 'DISCORD_CODE' } }))
    dispatchWeb(setModalVisibility({ isVisible: true }))
  }, [dispatchWeb])

  const renderTierTile = () => {
    return (
      <Tile
        styles={{
          root: styles.tileRoot,
          tile: styles.tile,
          content: styles.tileContent
        }}>
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
        }}>
        <Image style={styles.token} source={TokenStill} />
        <GradientText style={styles.tileHeader}>{messages.what}</GradientText>
        <Text style={styles.tileSubheader}>{messages.whatBody1}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(LEARN_MORE_LINK)}
          activeOpacity={0.7}>
          <Text style={styles.tileLink}>{messages.learnMore}</Text>
        </TouchableOpacity>
        <Text style={styles.tileSubheader}>{messages.whatBody2}</Text>
      </Tile>
    )
  }

  return (
    <Screen>
      <Header text={messages.title} />
      <ScrollView style={styles.tiles}>
        {renderAudioTile()}
        {renderWalletTile()}
        {renderRewardsTile()}
        {renderTrendingTile()}
        {renderTierTile()}
        {renderWhatTile()}
      </ScrollView>
    </Screen>
  )
}
