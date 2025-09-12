import { useMemo, useState, useEffect } from 'react'

import {
  buySellMessages,
  buySellMessages as messages
} from '@audius/common/messages'
import { useBuySellModal, useAddCashModal } from '@audius/common/store'
import {
  IconJupiterLogo,
  IconQuestionCircle,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  PlainButton,
  Text
} from '@audius/harmony'

import { ExternalLink } from 'components/link'

import { BuySellFlow } from './BuySellFlow'
import { Screen } from './types'

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()

  const [modalScreen, setModalScreen] = useState<Screen>('input')
  const [isFlowLoading, setIsFlowLoading] = useState(false)

  // Reset modal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalScreen('input')
      setIsFlowLoading(false)
    }
  }, [isOpen])

  const title = useMemo(() => {
    if (isFlowLoading) return ''
    if (modalScreen === 'confirm') return messages.confirmDetails
    if (modalScreen === 'success') return messages.modalSuccessTitle
    return messages.title
  }, [isFlowLoading, modalScreen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader
        onClose={onClose}
        showDismissButton={!isFlowLoading && modalScreen !== 'success'}
      >
        <ModalTitle title={title} />
        <PlainButton
          size='default'
          asChild
          iconLeft={IconQuestionCircle}
          css={(theme) => ({
            position: 'absolute',
            top: theme.spacing.xl,
            right: theme.spacing.xl,
            zIndex: 1
          })}
        >
          <ExternalLink to='https://help.audius.co/product/wallet-guide'>
            {buySellMessages.help}
          </ExternalLink>
        </PlainButton>
      </ModalHeader>
      <ModalContent>
        <BuySellFlow
          onClose={onClose}
          openAddCashModal={openAddCashModal}
          onScreenChange={setModalScreen}
          onLoadingStateChange={setIsFlowLoading}
        />
      </ModalContent>
      {modalScreen !== 'success' && !isFlowLoading && (
        <ModalFooter
          gap='s'
          borderTop='strong'
          backgroundColor='surface1'
          pv='m'
        >
          <Text variant='label' size='xs' color='subdued'>
            {messages.poweredBy}
          </Text>
          <IconJupiterLogo />
        </ModalFooter>
      )}
    </Modal>
  )
}
