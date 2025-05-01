import { useCallback, useEffect, useState, useContext } from 'react'

import { useSwapTokens } from '@audius/common/api'
import { buySellMessages as messages } from '@audius/common/messages'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/buy-audio/constants'
import { useBuySellModal } from '@audius/common/store'
import {
  Button,
  Flex,
  Hint,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SegmentedControl,
  Text,
  TextLink
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'

import { BuyTab } from './BuyTab'
import { SellTab } from './SellTab'
import { SUPPORTED_TOKEN_PAIRS } from './constants'
import { BuySellTab } from './types'

// import { useIsMobile } from 'hooks/useIsMobile' // Keep for potential mobile-specific adjustments - Removing for now

type TabOption = {
  key: BuySellTab
  text: string
}

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { spacing, color } = useTheme()
  const { toast } = useContext(ToastContext)
  // const isMobile = useIsMobile() // Keep for potential mobile-specific adjustments - Removing for now
  const [activeTab, setActiveTab] = useState<BuySellTab>('buy')
  // selectedPairIndex will be used in future when multiple token pairs are supported
  const [selectedPairIndex] = useState(0)

  // Transaction state
  const [transactionData, setTransactionData] = useState<{
    inputAmount: number
    outputAmount: number
    isValid: boolean
  } | null>(null)

  // Get the swap tokens mutation
  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError
  } = useSwapTokens()

  const tabs: TabOption[] = [
    { key: 'buy', text: messages.buy },
    { key: 'sell', text: messages.sell }
  ]

  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const handleActiveTabChange = useCallback((newTab: BuySellTab) => {
    setActiveTab(newTab)
    // Reset transaction data when changing tabs
    setTransactionData(null)
  }, [])

  const handleTransactionDataChange = useCallback(
    (data: { inputAmount: number; outputAmount: number; isValid: boolean }) => {
      setTransactionData(data)
    },
    []
  )

  // Handle continue button click
  const handleContinueClick = useCallback(() => {
    if (!transactionData || !transactionData.isValid) return

    const { inputAmount } = transactionData

    // Default slippage is 50 basis points (0.5%)
    const slippageBps = 50

    // Determine swap direction based on active tab
    if (activeTab === 'buy') {
      // Buy AUDIO with USDC
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.USDC.address,
        outputMint: TOKEN_LISTING_MAP.AUDIO.address,
        amountUi: inputAmount,
        slippageBps
      })
    } else {
      // Sell AUDIO for USDC
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.AUDIO.address,
        outputMint: TOKEN_LISTING_MAP.USDC.address,
        amountUi: inputAmount,
        slippageBps
      })
    }
  }, [activeTab, transactionData, swapTokens])

  // Handle swap status changes
  useEffect(() => {
    if (swapStatus === 'success') {
      toast(
        activeTab === 'buy'
          ? 'Successfully purchased AUDIO!'
          : 'Successfully sold AUDIO!',
        3000
      )

      // Close modal after 1 second on success
      const timer = setTimeout(() => {
        onClose()
      }, 1000)

      return () => clearTimeout(timer)
    } else if (swapStatus === 'error') {
      toast(swapError?.message || 'Transaction failed. Please try again.', 5000)
    }
  }, [swapStatus, swapError, activeTab, onClose, toast])

  const isContinueButtonLoading = swapStatus === 'pending'

  const isContinueButtonDisabled =
    !transactionData?.isValid || isContinueButtonLoading

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader onClose={onClose} showDismissButton={true}>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='l'>
          <Flex alignItems='center' justifyContent='space-between'>
            <SegmentedControl
              options={tabs}
              selected={activeTab}
              onSelectOption={handleActiveTabChange}
              css={{ flex: 1 }}
            />
          </Flex>

          {activeTab === 'buy' ? (
            <BuyTab
              tokenPair={selectedPair}
              onTransactionDataChange={handleTransactionDataChange}
            />
          ) : (
            <SellTab
              tokenPair={selectedPair}
              onTransactionDataChange={handleTransactionDataChange}
            />
          )}

          <Hint>
            {messages.helpCenter}{' '}
            <TextLink
              variant='visible'
              href='#' // Replace with actual URL when available
            >
              {messages.walletGuide}
            </TextLink>
          </Hint>

          <Button
            variant='primary'
            fullWidth
            disabled={isContinueButtonDisabled}
            onClick={handleContinueClick}
          >
            {isContinueButtonLoading ? (
              <Flex alignItems='center' justifyContent='center' gap='s'>
                <LoadingSpinner css={{ width: '16px', height: '16px' }} />
                <span>Processing...</span>
              </Flex>
            ) : (
              messages.continue
            )}
          </Button>
        </Flex>
      </ModalContent>
      <ModalFooter
        css={{
          justifyContent: 'center',
          gap: spacing.s,
          borderTop: `1px solid ${color.border.strong}`,
          backgroundColor: color.background.surface1
        }}
      >
        <Text variant='label' size='xs' color='subdued'>
          {messages.poweredBy}
        </Text>
      </ModalFooter>
    </Modal>
  )
}
