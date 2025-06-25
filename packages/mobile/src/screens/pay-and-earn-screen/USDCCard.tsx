import { useCallback } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useAddCashModal } from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import { css } from '@emotion/native'
import LinearGradient from 'react-native-linear-gradient'

import {
  Text,
  IconQuestionCircle,
  Flex,
  Button,
  Paper,
  PlainButton
} from '@audius/harmony-native'
import LogoUSDCInverted from 'app/assets/images/logoUSDCInverted.svg'
import { useLink } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  buyAndSell: 'Buy and sell music with USDC.',
  learnMore: 'Learn More',
  addFunds: 'Add Funds',
  usdc: 'USDC'
}

const useStyles = makeStyles(({ spacing }) => ({
  spinner: {
    alignSelf: 'center',
    width: spacing(8),
    height: spacing(8)
  },
  cardHeader: {
    padding: spacing(6),
    gap: spacing(2),
    borderTopLeftRadius: spacing(2),
    borderTopRightRadius: spacing(2)
  }
}))

export const USDCCard = () => {
  const styles = useStyles()
  const { data: balance } = useUSDCBalance()
  const usdcBalanceFormatted = USDC(balance ?? 0).toLocaleString()

  const { onPress: onLearnMorePress } = useLink(LEARN_MORE_LINK)

  const { onOpen: openAddCashModal } = useAddCashModal()

  const onAddFundsPress = useCallback(() => {
    openAddCashModal()
  }, [openAddCashModal])

  if (balance === null) {
    return <LoadingSpinner style={[styles.spinner]} />
  }

  return (
    <Paper>
      <LinearGradient
        style={styles.cardHeader}
        colors={['#2775CAdd', '#2775CA']}
        useAngle
        angle={90}
      >
        <Flex>
          <Flex direction='row' alignItems='center' gap='xs'>
            <LogoUSDCInverted height={spacing(5)} width={spacing(5)} />
            <Text
              variant='heading'
              size='s'
              strength='strong'
              color='staticWhite'
              style={css({ opacity: 0.8 })}
            >
              {messages.usdc}
            </Text>
          </Flex>
          <Text
            variant='display'
            size='s'
            strength='strong'
            color='staticWhite'
          >
            ${usdcBalanceFormatted}
          </Text>
        </Flex>
        <Text variant='body' color='staticWhite'>
          {messages.buyAndSell}
        </Text>
        <PlainButton
          style={{ alignSelf: 'flex-start' }}
          variant='inverted'
          onPress={onLearnMorePress}
          iconLeft={IconQuestionCircle}
        >
          {messages.learnMore}
        </PlainButton>
      </LinearGradient>
      <Flex
        p='xl'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
        backgroundColor='white'
      >
        <Button onPress={onAddFundsPress} variant='secondary' fullWidth>
          {messages.addFunds}
        </Button>
      </Flex>
    </Paper>
  )
}
