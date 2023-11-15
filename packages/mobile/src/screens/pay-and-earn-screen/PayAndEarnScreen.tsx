import React, { useCallback } from 'react'

import type { BNUSDC } from '@audius/common'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useUSDCBalance
} from '@audius/common'
import BN from 'bn.js'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconQuestionCircle from 'app/assets/images/iconQuestionCircle.svg'
import LogoUSDCInverted from 'app/assets/images/logoUSDCInverted.svg'
import {
  ScrollView,
  Screen,
  Button,
  Text,
  ScreenContent,
  useLink
} from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  title: 'PAYMENTs & EARNINGS',
  buyAndSell: 'Buy and sell music with USDC.',
  learnMore: 'Learn More',
  addFunds: 'Add Funds'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(3)
  },
  spinner: {
    alignSelf: 'center',
    width: spacing(8),
    height: spacing(8)
  },
  card: {},
  cardHeader: {
    padding: spacing(6),
    borderTopLeftRadius: spacing(3),
    borderTopRightRadius: spacing(3),
    backgroundColor: palette.accentOrange
  },
  logoContainer: {
    ...flexRowCentered(),
    gap: spacing(1)
  },
  usdc: {
    fontSize: spacing(5),
    fontWeight: '900',
    color: palette.white,
    opacity: 0.8
  },
  balance: {
    fontSize: spacing(10.5),
    fontWeight: '900',
    color: palette.white,
    lineHeight: spacing(13)
  },
  buyAndSell: {
    fontSize: spacing(4),
    fontWeight: '500',
    color: palette.white,
    marginTop: spacing(2)
  },
  learnMore: {
    ...flexRowCentered(),
    gap: spacing(1),
    marginTop: spacing(2)
  },
  cardButtons: {
    padding: spacing(6),
    borderBottomLeftRadius: spacing(3),
    borderBottomRightRadius: spacing(3),
    backgroundColor: palette.white
  },
  addFundsButton: {
    marginHorizontal: spacing(6)
  }
}))

const USDCCard = () => {
  const styles = useStyles()
  const white = useColor('white')
  const { data: balance } = useUSDCBalance({
    isPolling: true,
    pollingInterval: 3000
  })
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_LINK)

  // TODO: Implement
  const onAddFundsPress = useCallback(() => {}, [])

  if (balance === null) {
    return <LoadingSpinner style={[styles.spinner]} />
  }

  return (
    <View style={styles.card}>
      <LinearGradient
        style={styles.cardHeader}
        colors={['#2775CAdd', '#2775CA']}
        useAngle
        angle={90}
      >
        <View style={styles.logoContainer}>
          <LogoUSDCInverted height={spacing(5)} width={spacing(5)} />
          <Text style={styles.usdc}>USDC</Text>
        </View>
        <Text style={styles.balance}>${usdcBalanceFormatted}</Text>
        <Text style={styles.buyAndSell}>{messages.buyAndSell}</Text>
        <TouchableOpacity style={styles.learnMore} onPress={onLearnMorePress}>
          <IconQuestionCircle
            height={spacing(4)}
            width={spacing(4)}
            fill={white}
          />
          <Text fontSize='small' weight='bold' color='white'>
            {messages.learnMore}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
      <View style={styles.cardButtons}>
        <Button
          style={styles.addFundsButton}
          title={messages.addFunds}
          onPress={onAddFundsPress}
          variant='common'
          size='large'
          fullWidth
        />
      </View>
    </View>
  )
}

export const PayAndEarnScreen = () => {
  const styles = useStyles()
  return (
    <Screen
      url='/payandearn'
      variant='secondary'
      title={messages.title}
      style={styles.root}
    >
      <ScreenContent>
        <ScrollView>
          <USDCCard />
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
