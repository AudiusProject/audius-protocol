import { useArtistCoinInsights, useTokenBalance } from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import {
  tokenDashboardPageActions,
  useAddCashModal,
  useBuySellModal
} from '@audius/common/store'
import { Button, Flex, Paper, Text, useTheme, Artwork } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import Skeleton from 'components/skeleton/Skeleton'
import { useIsMobile } from 'hooks/useIsMobile'

import { AssetDetailProps } from '../types'

type BalanceStateProps = {
  title: string
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
  title,
  logoURI,
  onBuy,
  onReceive
}: BalanceStateProps) => {
  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} />
        <Text variant='heading' size='l' color='subdued'>
          {title}
        </Text>
      </Flex>
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
  title,
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
              {title}
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

const BalanceSectionContent = ({ mint }: AssetDetailProps) => {
  const { data: coinInsights, isPending: coinsLoading } = useArtistCoinInsights(
    { mint }
  )
  const { data: tokenBalance } = useTokenBalance({ mint })

  // Modal hooks
  const { onOpen: openBuySellModal } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  if (coinsLoading || !coinInsights) {
    return <BalanceSectionSkeleton />
  }

  if (!coinInsights.logoURI) {
    return null
  }

  const title = coinInsights.symbol ?? ''
  const logoURI = coinInsights.logoURI

  // Action destructuring
  const { pressReceive, pressSend } = tokenDashboardPageActions

  // Handler functions
  const handleBuySell = () => {
    // Has balance - show buy/sell modal
    openBuySellModal()
  }

  const handleAddCash = () => {
    // No balance - show add cash modal (uses Coinflow)
    openAddCashModal()
  }

  const handleReceive = () => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }

  const handleSend = () => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }

  return (
    <Paper ph='xl' pv='l'>
      <Flex direction='column' gap='l' w='100%'>
        {!tokenBalance?.balance ||
        Number(tokenBalance.balance.toString()) === 0 ? (
          <ZeroBalanceState
            title={title}
            logoURI={logoURI}
            onBuy={handleAddCash}
            onReceive={handleReceive}
          />
        ) : (
          <HasBalanceState
            title={title}
            logoURI={logoURI}
            onBuy={handleBuySell}
            onSend={handleSend}
            onReceive={handleReceive}
            mint={mint}
          />
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
