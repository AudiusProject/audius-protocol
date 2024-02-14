import { useCallback } from 'react'

import { useUSDCBalance } from '@audius/common/hooks'
import type { BNUSDC } from '@audius/common/models'
import { useAddFundsModal } from '@audius/common/store'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common/utils'
import { css } from '@emotion/native'
import BN from 'bn.js'
import { TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  Text,
  IconQuestionCircle,
  Flex,
  Button,
  Paper
} from '@audius/harmony-native'
import LogoUSDCInverted from 'app/assets/images/logoUSDCInverted.svg'
import { useLink } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

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
        <TouchableOpacity onPress={onLearnMorePress}>
          <Flex direction='row' alignItems='center' gap='xs'>
            <IconQuestionCircle
              height={spacing(4)}
              width={spacing(4)}
              fill={white}
            />
            <Text variant='body' size='s' strength='strong' color='staticWhite'>
              {messages.learnMore}
            </Text>
          </Flex>
        </TouchableOpacity>
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
