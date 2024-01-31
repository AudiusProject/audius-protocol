import React, { useCallback } from 'react'

import { useUSDCBalance } from '@audius/common/hooks'
import type { BNUSDC } from '@audius/common/models'
import { useAddFundsModal } from '@audius/common/store'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common/utils'
import BN from 'bn.js'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { IconQuestionCircle } from '@audius/harmony-native'
import LogoUSDCInverted from 'app/assets/images/logoUSDCInverted.svg'
import { Button, Text, useLink } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  buyAndSell: 'Buy and sell music with USDC.',
  learnMore: 'Learn More',
  addFunds: 'Add Funds'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(3)
  },
  spinner: {
    alignSelf: 'center',
    width: spacing(8),
    height: spacing(8)
  },
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
    color: palette.staticWhite,
    opacity: 0.8
  },
  balance: {
    fontSize: spacing(10.5),
    fontWeight: '900',
    color: palette.staticWhite,
    lineHeight: spacing(13)
  },
  buyAndSell: {
    fontSize: spacing(4),
    fontWeight: '500',
    color: palette.staticWhite,
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

export const USDCCard = () => {
  const styles = useStyles()
  const white = useColor('staticWhite')
  const { data: balance } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_LINK)

  const { onOpen: openAddFundsModal } = useAddFundsModal()

  const onAddFundsPress = useCallback(() => {
    openAddFundsModal()
  }, [openAddFundsModal])

  if (balance === null) {
    return <LoadingSpinner style={[styles.spinner]} />
  }

  return (
    <View>
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
          <Text fontSize='small' weight='bold' color='staticWhite'>
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
