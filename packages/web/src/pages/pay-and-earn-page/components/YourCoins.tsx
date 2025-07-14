import { useCallback, useContext } from 'react'

import { useTokenBalance, useTokenPrice } from '@audius/common/api'
import {
  useFeatureFlag,
  useFormattedAudioBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { BONK } from '@audius/fixed-decimal'
import {
  Button,
  Flex,
  IconTokenAUDIO,
  Paper,
  Text,
  useMedia,
  useTheme,
  IconTokenBonk,
  Divider,
  IconCaretRight
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ToastContext } from 'components/toast/ToastContext'

import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages,
  managedAccount: "You can't do that as a managed user",
  findMoreCoins: 'Find More Coins',
  exploreArtistCoins: 'Explore available artist coins on Audius.',
  bonkTicker: '$BONK'
}

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route

const YourCoinsHeader = () => {
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
      borderBottom='default'
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
  const { color, spacing } = useTheme()
  const { isMobile } = useMedia()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const { data: bonkBalance, status: bonkBalanceStatus } = useTokenBalance({
    token: 'BONK'
  })
  // TODO: use getTokenRegistry instead
  const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
  const { data: bonkPriceData, isPending: isBonkPriceLoading } =
    useTokenPrice(BONK_MINT)

  const bonkBalanceFormatted = bonkBalance
    ? BONK(bonkBalance.toString()).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    : null
  const bonkDollarValue =
    bonkPriceData?.price && bonkBalance
      ? `$${(Number(bonkBalance.toString()) * Number(bonkPriceData.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null
  const isBonkLoading =
    bonkBalanceStatus === Status.LOADING || isBonkPriceLoading

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <Paper column shadow='far' borderRadius='l' css={{ overflow: 'hidden' }}>
      {isWalletUIBuySellEnabled ? <YourCoinsHeader /> : null}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : undefined}
        alignSelf='stretch'
      >
        <CoinCard
          icon={<IconTokenAUDIO width={DIMENSIONS} height={DIMENSIONS} hex />}
          symbol={messages.audioTicker}
          balance={audioBalanceFormatted ?? ''}
          dollarValue={audioDollarValue ?? ''}
          loading={isLoading}
          onClick={handleTokenClick}
        />
        <Divider orientation='vertical' />
        <CoinCard
          icon={<IconTokenBonk width={DIMENSIONS} height={DIMENSIONS} hex />}
          symbol={messages.bonkTicker}
          balance={bonkBalanceFormatted ?? ''}
          dollarValue={bonkDollarValue ?? ''}
          loading={isBonkLoading}
          onClick={handleTokenClick}
        />
      </Flex>
      <Flex
        p={isMobile ? spacing.l : spacing.xl}
        css={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: color.background.surface2 }
        }}
      >
        <Flex flex={1} alignItems='center' justifyContent='space-between'>
          <Flex column gap='xs'>
            <Text variant='heading' size='m' color='default'>
              {messages.findMoreCoins}
            </Text>
            <Text color='subdued'>{messages.exploreArtistCoins}</Text>
          </Flex>
          <IconCaretRight size='l' color='subdued' />
        </Flex>
      </Flex>
    </Paper>
  )
}
