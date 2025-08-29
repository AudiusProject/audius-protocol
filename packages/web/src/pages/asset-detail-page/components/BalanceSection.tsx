import {
  useArtistCoins,
  useTokenBalance,
  useUSDCBalance
} from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import {
  useAddCashModal,
  useBuySellModal,
  useReceiveTokensModal,
  useSendTokensModal
} from '@audius/common/store'
import { Artwork, Button, Flex, Paper, Text, useTheme } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import { SendTokensModal } from 'components/send-tokens-modal'
import Skeleton from 'components/skeleton/Skeleton'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'

type BalanceStateProps = {
  ticker: string
  logoURI?: string
  onBuy?: () => void
  onReceive?: () => void
  onSend?: () => void
}

const BalanceSectionSkeleton = () => {
  return (
    <Paper ph='xl' pv='l'>
      <Flex direction='column' gap='l' w='100%'>
        <Flex gap='s' alignItems='center'>
          <Skeleton width='64px' height='64px' />
          <Skeleton width='120px' height='24px' />
        </Flex>
        <Flex gap='s'>
          <Skeleton width='100%' height='40px' />
          <Skeleton width='100%' height='40px' />
        </Flex>
      </Flex>
    </Paper>
  )
}

const TokenIcon = ({ logoURI }: { logoURI?: string }) => {
  const { spacing } = useTheme()

  if (!logoURI) return null

  return (
    <Artwork
      src={logoURI}
      hex
      w={spacing.unit16}
      h={spacing.unit16}
      borderWidth={0}
    />
  )
}

const ZeroBalanceState = ({
  ticker,
  logoURI,
  onBuy,
  onReceive
}: BalanceStateProps) => {
  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} />
        <Text variant='heading' size='l' color='subdued'>
          {ticker}
        </Text>
      </Flex>
      <Paper
        ph='xl'
        pv='l'
        backgroundColor='surface2'
        border='default'
        direction='column'
        gap='xs'
      >
        <Text variant='heading' size='s'>
          {walletMessages.becomeMemberTitle}
        </Text>
        <Text variant='body' size='s' color='default' strength='default'>
          {walletMessages.becomeMemberBody(ticker)}
        </Text>
      </Paper>
      <Flex gap='s'>
        <Button variant='primary' fullWidth onClick={onBuy}>
          {walletMessages.buy}
        </Button>
        <Button variant='secondary' fullWidth onClick={onReceive}>
          {walletMessages.receive}
        </Button>
      </Flex>
    </>
  )
}

const HasBalanceState = ({
  ticker,
  logoURI,
  onBuy,
  onSend,
  onReceive,
  mint
}: BalanceStateProps & { mint: string }) => {
  const { motion } = useTheme()
  const {
    tokenBalanceFormatted,
    tokenDollarValue,
    isTokenBalanceLoading,
    isTokenPriceLoading
  } = useFormattedTokenBalance(mint)

  const isLoading = isTokenBalanceLoading || isTokenPriceLoading

  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} />
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
              {tokenBalanceFormatted}
            </Text>
            <Text variant='heading' size='l' color='subdued'>
              {ticker}
            </Text>
          </Flex>
          <Text variant='heading' size='s' color='subdued'>
            {tokenDollarValue}
          </Text>
        </Flex>
      </Flex>
      <Flex direction='column' gap='s'>
        <Button variant='secondary' fullWidth onClick={onBuy}>
          {walletMessages.buySell}
        </Button>
        <Flex gap='s'>
          <Button variant='secondary' fullWidth onClick={onSend}>
            {walletMessages.send}
          </Button>
          <Button variant='secondary' fullWidth onClick={onReceive}>
            {walletMessages.receive}
          </Button>
        </Flex>
      </Flex>
    </>
  )
}

type AssetDetailProps = {
  mint: string
}

const BalanceSectionContent = ({ mint }: AssetDetailProps) => {
  const { data: coinInsights, isPending: coinsLoading } = useArtistCoins({
    mint: [mint]
  })
  const { data: tokenBalance } = useTokenBalance({ mint })
  const { data: usdcBalance } = useUSDCBalance()

  const coin = coinInsights?.[0]

  // Modal hooks
  const { onOpen: openBuySellModal } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')
  const { onOpen: openReceiveTokensModal } = useReceiveTokensModal()
  const { onOpen: openSendTokensModal } = useSendTokensModal()

  const isMobile = useIsMobile()

  // Handler functions with account requirements - defined before early return
  const handleBuySell = useRequiresAccountCallback(() => {
    // Has balance - show buy/sell modal
    openBuySellModal()
  }, [openBuySellModal])

  const handleAddCash = useRequiresAccountCallback(() => {
    if (usdcBalance && usdcBalance > 0) {
      // Has USDC balance - show buy/sell modal
      openBuySellModal()
    } else {
      // No USDC balance - show add cash modal (uses Coinflow)
      openAddCashModal()
    }
  }, [openAddCashModal, openBuySellModal, usdcBalance])

  const handleReceive = useRequiresAccountCallback(() => {
    openReceiveTokensModal({
      mint,
      isOpen: true
    })
  }, [mint, openReceiveTokensModal])

  const handleSend = useRequiresAccountCallback(() => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      openSendTokensModal({
        mint,
        isOpen: true
      })
    }
  }, [isMobile, openTransferDrawer, openSendTokensModal, mint])

  if (coinsLoading || !coin) {
    return <BalanceSectionSkeleton />
  }

  const ticker = coin.ticker ?? ''
  const logoURI = coin.logoUri

  return (
    <>
      <Paper ph='xl' pv='l'>
        <Flex direction='column' gap='l' w='100%'>
          {!tokenBalance?.balance ||
          Number(tokenBalance.balance.toString()) === 0 ? (
            <ZeroBalanceState
              ticker={ticker}
              logoURI={logoURI}
              onBuy={handleAddCash}
              onReceive={handleReceive}
            />
          ) : (
            <HasBalanceState
              ticker={ticker}
              logoURI={logoURI}
              onBuy={handleBuySell}
              onSend={handleSend}
              onReceive={handleReceive}
              mint={mint}
            />
          )}
        </Flex>
      </Paper>

      <SendTokensModal />
    </>
  )
}

export const BalanceSection = componentWithErrorBoundary(
  BalanceSectionContent,
  {
    name: 'BalanceSection',
    fallback: (
      <Paper ph='xl' pv='l'>
        <Flex direction='column' gap='l' w='100%'>
          <Text variant='body' size='m' color='subdued'>
            {walletMessages.errors.unableToLoadBalance}
          </Text>
        </Flex>
      </Paper>
    )
  }
)
