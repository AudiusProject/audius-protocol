import { useCallback, useState } from 'react'

import {
  useArtistCoin,
  useTokenBalance,
  useUSDCBalance
} from '@audius/common/api'
import {
  useFormattedTokenBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import {
  useAddCashModal,
  useBuySellModal,
  useReceiveTokensModal,
  useSendTokensModal
} from '@audius/common/store'
import {
  Artwork,
  Box,
  Button,
  Flex,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { useBuySellRegionSupport } from 'components/buy-sell-modal'
import Drawer from 'components/drawer/Drawer'
import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import { zIndex } from 'utils/zIndex'

const messages = {
  openTheApp: 'Open The App',
  drawerDescription:
    "You'll need to make this purchase in the app or on the web."
}

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
      <Flex column gap='l' w='100%'>
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
  onReceive,
  isBuySellSupported
}: BalanceStateProps & { isBuySellSupported: boolean }) => {
  const isManagerMode = useIsManagedAccount()
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
        <Tooltip
          disabled={isBuySellSupported && !isManagerMode}
          text={
            isManagerMode
              ? walletMessages.buySellNotSupportedManagerMode
              : walletMessages.buySellNotSupported
          }
          color='secondary'
          placement='top'
          shouldWrapContent={false}
        >
          <Box w='100%'>
            <Button
              variant='primary'
              fullWidth
              onClick={onBuy}
              disabled={!isBuySellSupported || isManagerMode}
            >
              {walletMessages.buy}
            </Button>
          </Box>
        </Tooltip>
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
  mint,
  isBuySellSupported
}: BalanceStateProps & { mint: string; isBuySellSupported: boolean }) => {
  const isManagerMode = useIsManagedAccount()
  const { motion } = useTheme()
  const {
    tokenBalanceFormatted,
    formattedHeldValue,
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
            {formattedHeldValue}
          </Text>
        </Flex>
      </Flex>
      <Flex direction='column' gap='s'>
        <Tooltip
          disabled={isBuySellSupported && !isManagerMode}
          text={
            isManagerMode
              ? walletMessages.buySellNotSupportedManagerMode
              : walletMessages.buySellNotSupported
          }
          color='secondary'
          placement='top'
          shouldWrapContent={false}
        >
          <Box w='100%'>
            <Button
              variant='secondary'
              fullWidth
              onClick={onBuy}
              disabled={!isBuySellSupported || isManagerMode}
            >
              {walletMessages.buySell}
            </Button>
          </Box>
        </Tooltip>
        <Flex gap='s'>
          <Button
            disabled={isManagerMode}
            variant='secondary'
            fullWidth
            onClick={onSend}
          >
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
  const { data: coin, isPending: coinsLoading } = useArtistCoin(mint)
  const { data: tokenBalance } = useTokenBalance({ mint })
  const { data: usdcBalance } = useUSDCBalance()

  const { isBuySellSupported } = useBuySellRegionSupport()

  // Modal hooks
  const { onOpen: openBuySellModal } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')
  const { onOpen: openReceiveTokensModal } = useReceiveTokensModal()
  const { onOpen: openSendTokensModal } = useSendTokensModal()
  const isMobile = useIsMobile()
  const [isOpenAppDrawerOpen, setIsOpenAppDrawerOpen] = useState(false)

  const onOpenOpenAppDrawer = useCallback(() => {
    setIsOpenAppDrawerOpen(true)
  }, [setIsOpenAppDrawerOpen])

  const onCloseOpenAppDrawer = useCallback(() => {
    setIsOpenAppDrawerOpen(false)
  }, [setIsOpenAppDrawerOpen])

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
    <Paper ph='xl' pv='l' border='default'>
      <Flex column gap='l' w='100%'>
        {!tokenBalance?.balance ||
        Number(tokenBalance.balance.toString()) === 0 ? (
          <ZeroBalanceState
            ticker={ticker}
            logoURI={logoURI}
            onBuy={isMobile ? onOpenOpenAppDrawer : handleAddCash}
            onReceive={handleReceive}
            isBuySellSupported={isBuySellSupported}
          />
        ) : (
          <HasBalanceState
            ticker={ticker}
            logoURI={logoURI}
            onBuy={isMobile ? onOpenOpenAppDrawer : handleBuySell}
            onSend={handleSend}
            onReceive={handleReceive}
            mint={mint}
            isBuySellSupported={isBuySellSupported}
          />
        )}
        {isMobile && (
          <Drawer
            zIndex={zIndex.BUY_SELL_MODAL}
            isOpen={isOpenAppDrawerOpen}
            onClose={onCloseOpenAppDrawer}
            shouldClose={!isOpenAppDrawerOpen}
          >
            <Flex direction='column' p='l' pb='2xl' w='100%'>
              <Box pv='s'>
                <Text
                  variant='label'
                  size='xl'
                  strength='strong'
                  color='subdued'
                  textAlign='center'
                >
                  {messages.openTheApp}
                </Text>
              </Box>
              <Box pv='l'>
                <Text>{messages.drawerDescription}</Text>
              </Box>
            </Flex>
          </Drawer>
        )}
      </Flex>
    </Paper>
  )
}

export const BalanceSection = componentWithErrorBoundary(
  BalanceSectionContent,
  {
    name: 'BalanceSection',
    fallback: (
      <Paper ph='xl' pv='l' border='default'>
        <Flex column gap='l' w='100%'>
          <Text variant='body' size='m' color='subdued'>
            {walletMessages.errors.unableToLoadBalance}
          </Text>
        </Flex>
      </Paper>
    )
  }
)
