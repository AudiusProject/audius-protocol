import { useMemo, useState, useEffect } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useBuySellModal, useAddCashModal } from '@audius/common/store'
import {
  Box,
  Button,
  Flex,
  IconButton,
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
import { useTheme } from '@emotion/react'

import { BuySellModalContent } from './BuySellModalContent'
import { Screen } from './types'

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()

  const [currentModalState, setCurrentModalState] = useState<Screen>('input')
  const [isModalContentLoading, setIsModalContentLoading] = useState(false)

  // Reset modal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentModalState('input')
      setIsModalContentLoading(false)
    }
  }, [isOpen])

  const title = useMemo(() => {
    if (isModalContentLoading) return ''
    if (currentModalState === 'confirm') return messages.confirmDetails
    if (currentModalState === 'success') return messages.modalSuccessTitle
    return messages.title
  }, [isModalContentLoading, currentModalState])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader
        onClose={onClose}
        showDismissButton={
          !isModalContentLoading && currentModalState !== 'success'
        }
      >
        <Flex justifyContent='space-between'>
          <Box w='l' />
          <ModalTitle title={title} />
          <PlainButton iconLeft={IconQuestionCircle}>Help</PlainButton>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <BuySellModalContent
          onClose={onClose}
          openAddCashModal={openAddCashModal}
          onScreenChange={setCurrentModalState}
          onLoadingStateChange={setIsModalContentLoading}
        />
      </ModalContent>
    </Modal>
  )
}
