import { useCallback, useContext } from 'react'

import {
  useFeatureFlag,
  useFormattedAudioBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconCaretRight,
  IconTokenAUDIO,
  Paper,
  Text,
  useMedia,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ToastContext } from 'components/toast/ToastContext'
import { HexagonalIcon } from 'components/user-badges/HexagonalIcon'

const messages = {
  ...buySellMessages,
  managedAccount: "You can't do that as a managed user"
}

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route

const YourCoinsHeader = () => {
  const { color } = useTheme()
  const { onOpen: openBuySellModal } = useBuySellModal()
  const isManagedAccount = useIsManagedAccount()
  const { toast } = useContext(ToastContext)

  const handleBuySellClick = useCallback(() => {
    if (isManagedAccount) {
      toast(messages.managedAccount)
    } else {
      openBuySellModal()
    }
  }, [isManagedAccount, openBuySellModal, toast])

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      p='l'
      css={{ borderBottom: `1px solid ${color.border.default}` }}
    >
      <Text variant='heading' size='m' color='heading'>
        {messages.yourCoins}
      </Text>
      <Button variant='secondary' size='small' onClick={handleBuySellClick}>
        {messages.buySell}
      </Button>
    </Flex>
  )
}

export const YourCoins = () => {
  const dispatch = useDispatch()
  const { color, spacing, motion } = useTheme()
  const { isMobile, isExtraSmall } = useMedia()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <Paper
      direction='column'
      shadow='far'
      borderRadius='l'
      css={{ overflow: 'hidden' }}
    >
      {isWalletUIBuySellEnabled ? <YourCoinsHeader /> : null}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : spacing.xl}
        alignSelf='stretch'
        onClick={handleTokenClick}
        css={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: color.background.surface2
          }
        }}
      >
        <Flex alignItems='center' gap={isExtraSmall ? 'm' : 'l'}>
          <HexagonalIcon size='5xl'>
            <IconTokenAUDIO width={DIMENSIONS} height={DIMENSIONS} />
          </HexagonalIcon>
          <Flex
            direction='column'
            gap='xs'
            css={{
              opacity: isLoading ? 0 : 1,
              transition: `opacity ${motion.expressive}`
            }}
          >
            <Flex gap='xs'>
              <Text variant='heading' size='l' color='default'>
                {audioBalanceFormatted}
              </Text>
              <Text variant='heading' size='l' color='subdued'>
                {messages.audioTicker}
              </Text>
            </Flex>
            <Text variant='heading' size='s' color='subdued'>
              {audioDollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
