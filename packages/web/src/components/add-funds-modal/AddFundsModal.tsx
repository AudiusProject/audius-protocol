import { useCallback, useState } from 'react'

import { useAddFundsModal } from '@audius/common'
import { ModalContent, ModalHeader } from '@audius/stems'
import cn from 'classnames'

import { AddFunds, Method } from 'components/add-funds/AddFunds'
import { Text } from 'components/typography'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './AddFundsModal.module.css'

const messages = {
  addFunds: 'Add Funds',
  cryptoTransfer: 'Crypto Transfer'
}

type Page = 'add-funds' | 'crypto-transfer'

export const AddFundsModal = () => {
  const { isOpen, onClose } = useAddFundsModal()
  const mobile = isMobile()

  const [page, setPage] = useState<Page>('add-funds')

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleClosed = useCallback(() => {
    setPage('add-funds')
  }, [setPage])

  const handleContinue = useCallback(
    (method: Method) => {
      setPage('crypto-transfer')
    },
    [setPage]
  )

  return (
    <ModalDrawer
      zIndex={zIndex.ADD_FUNDS_MODAL}
      size={'small'}
      onClose={handleClose}
      isOpen={isOpen}
      onClosed={handleClosed}
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
          {page === 'add-funds' ? messages.addFunds : messages.cryptoTransfer}
        </Text>
      </ModalHeader>
      <ModalContent>
        {page === 'add-funds' ? (
          <AddFunds onContinue={handleContinue} />
        ) : (
          <USDCManualTransfer onClose={handleClose} />
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
