import { useWithdrawUSDCModal, WithdrawUSDCModalPages } from '@audius/common'
import { Modal, ModalContent, ModalHeader } from '@audius/stems'

import { ReactComponent as IconTransaction } from 'assets/img/iconTransaction.svg'
import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import styles from './WithdrawUSDCModal.module.css'
import { ConfirmTransferDetails } from './components/ConfirmTransferDetails'
import { EnterTransferDetails } from './components/EnterTransferDetails'
import { TransferInProgress } from './components/TransferInProgress'
import { TransferSuccessful } from './components/TransferSuccessful'

const messages = {
  title: 'Withdraw Funds'
}

export const WithdrawUSDCModal = () => {
  const { isOpen, onClose, onClosed, data } = useWithdrawUSDCModal()
  const { page } = data

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      bodyClassName={styles.modal}
    >
      <ModalHeader onClose={onClose}>
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          <Icon size='large' icon={IconTransaction} />
          {messages.title}
        </Text>
      </ModalHeader>
      <ModalContent>
        {page === WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS ? (
          <EnterTransferDetails />
        ) : null}
        {page === WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS ? (
          <ConfirmTransferDetails />
        ) : null}
        {page === WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS ? (
          <TransferInProgress />
        ) : null}
        {page === WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL ? (
          <TransferSuccessful />
        ) : null}
      </ModalContent>
    </Modal>
  )
}
