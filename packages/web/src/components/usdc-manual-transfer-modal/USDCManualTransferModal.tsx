import { useCallback } from 'react'

import { useUSDCManualTransferModal } from '@audius/common'
import { ModalContent, ModalHeader } from '@audius/stems'
import cn from 'classnames'

import { Text } from 'components/typography'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './USDCManualTransferModal.module.css'

const messages = {
  title: 'Crypto Transfer'
}

export const USDCManualTransferModal = () => {
  const { isOpen, onClose, data } = useUSDCManualTransferModal()
  const { amount, onSuccessAction } = data ?? {}
  const mobile = isMobile()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <ModalDrawer
      zIndex={zIndex.USDC_MANUAL_TRANSFER_MODAL}
      size={'small'}
      onClose={handleClose}
      isOpen={isOpen}
      bodyClassName={styles.modal}
      useGradientTitle={false}
      dismissOnClickOutside
      isFullscreen={false}
    >
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: mobile })}
        onClose={onClose}
        showDismissButton={!mobile}
      >
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          {messages.title}
        </Text>
      </ModalHeader>
      <ModalContent>
        <USDCManualTransfer
          onClose={handleClose}
          source='purchase'
          amountInCents={amount}
          onSuccessAction={onSuccessAction}
        />
      </ModalContent>
    </ModalDrawer>
  )
}
