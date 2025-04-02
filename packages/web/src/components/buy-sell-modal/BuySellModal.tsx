import { useCallback, useState } from 'react'

import { useBuySellModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  SegmentedControl,
  Box,
  Flex,
  Text,
  TextInput,
  Button,
  Divider,
  IconLogoCircleUSDC,
  IconAudiusLogo,
  IconInfo
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

// import { useIsMobile } from 'hooks/useIsMobile' // Keep for potential mobile-specific adjustments - Removing for now

const messages = {
  title: 'BUY / SELL',
  buy: 'Buy',
  sell: 'Sell',
  youPay: 'You Pay',
  amountUSDC: 'Amount (USDC)',
  max: 'MAX',
  available: 'Available',
  youReceive: 'You Receive',
  audioTicker: '$AUDIO',
  continue: 'Continue',
  poweredBy: 'POWERED BY'
}

type BuySellTab = 'buy' | 'sell'

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { spacing } = useTheme()
  // const isMobile = useIsMobile() // Keep for potential mobile-specific adjustments - Removing for now
  const [activeTab, setActiveTab] = useState<BuySellTab>('buy')

  const tabs = [
    { key: 'buy', text: messages.buy },
    { key: 'sell', text: messages.sell }
  ]

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab as BuySellTab)
  }, [])

  // TODO: Replace placeholders with actual data and logic
  const availableUSDC = 100.0
  const receivedAudio = 0
  const audioPrice = 0.082

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'medium'}>
      <ModalHeader onClose={onClose} showDismissButton={true}>
        <ModalTitle
          title={
            <Text variant='label' size='xl' strength='strong'>
              {messages.title}
            </Text>
          }
        />
      </ModalHeader>
      <ModalContent
        css={{
          padding: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xl
        }}
      >
        <SegmentedControl
          options={tabs}
          selected={activeTab}
          onSelectOption={handleTabChange}
          fullWidth
        />

        <Flex direction='column' gap='m'>
          <Flex alignItems='center' gap='m'>
            <Text variant='body' size='m' strength='strong' color='subdued'>
              {messages.youPay}
            </Text>
            <Divider css={{ flexGrow: 1 }} />
          </Flex>
          <Flex
            border='strong'
            borderRadius='m'
            gap='s'
            p='l'
            alignItems='flex-start'
          >
            <Flex alignItems='flex-start' gap='s' css={{ flexGrow: 1 }}>
              <TextInput
                label={messages.amountUSDC}
                placeholder='0.00'
                css={{ flexGrow: 1 }}
              />
              <Button variant='secondary' size='small'>
                {messages.max}
              </Button>
            </Flex>
            <Flex
              direction='column'
              alignItems='flex-end'
              justifyContent='center'
              gap='xs'
              css={{ flexGrow: 1, alignSelf: 'stretch' }}
            >
              <Flex alignItems='center' gap='s'>
                <IconLogoCircleUSDC size='s' />
                <Text size='s' color='subdued'>
                  {messages.available}
                </Text>
                <IconInfo size='s' color='subdued' />
              </Flex>
              <Text variant='title' size='xl' strength='strong'>
                ${availableUSDC.toFixed(2)}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction='column' gap='m'>
          <Flex alignItems='center' gap='m'>
            <Text variant='body' size='m' strength='strong' color='subdued'>
              {messages.youReceive}
            </Text>
            <Divider css={{ flexGrow: 1 }} />
          </Flex>
          <Box
            border='strong'
            borderRadius='m'
            p='l'
            css={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.l
            }}
          >
            <IconAudiusLogo size='xl' />
            <Flex direction='column'>
              <Text variant='display' size='s' strength='strong'>
                {receivedAudio}
              </Text>
              <Flex gap='xs'>
                <Text size='s' color='subdued'>
                  {messages.audioTicker}
                </Text>
                <Text size='s' color='subdued'>
                  ({`$${audioPrice}`})
                </Text>
              </Flex>
            </Flex>
          </Box>
        </Flex>

        <Button variant='primary' size='large' fullWidth>
          {messages.continue}
        </Button>
      </ModalContent>
      <ModalFooter
        css={{
          justifyContent: 'center',
          gap: spacing.s,
          borderTop: '1px solid var(--harmony-border-strong)',
          backgroundColor: 'var(--harmony-bg-surface-1)'
        }}
      >
        <Text variant='label' size='xs' color='subdued'>
          {messages.poweredBy}
        </Text>
      </ModalFooter>
    </Modal>
  )
}
