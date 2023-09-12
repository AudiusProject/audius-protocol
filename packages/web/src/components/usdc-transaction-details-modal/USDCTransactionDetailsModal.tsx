import {
  formatUSDCWeiToUSDString,
  useUSDCTransactionDetailsModal
} from '@audius/common'
import {
  HarmonyButton,
  IconExternalLink,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import moment from 'moment'

import { Icon } from 'components/Icon'
import { ExternalLink } from 'components/link'
import { Text } from 'components/typography'

import styles from './USDCTransactionDetailsModal.module.css'

const messages = {
  amountSent: 'Amount Sent',
  destinationWallet: 'Destination Wallet',
  transaction: 'Transaction',
  date: 'Date',
  done: 'Done',
  withdrawal: 'Withdrawal',
  usdcWithdrawal: 'USDC Withdrawal'
}

const makeSolscanLink = (signature: string) =>
  `https://solscan.io/tx/${signature}`

const DetailSection = ({
  value,
  label
}: {
  value: React.ReactNode
  label: React.ReactNode
}) => (
  <div className={styles.detailSection}>
    <Text variant='label' size='large' color='neutralLight4'>
      {label}
    </Text>
    <Text className={styles.detailValue} size='large'>
      {value}
    </Text>
  </div>
)

export const USDCTransactionDetailsModal = () => {
  const { isOpen, data, onClose, onClosed } = useUSDCTransactionDetailsModal()
  const { transactionDetails } = data

  if (!transactionDetails) {
    console.error(
      'USDCTransactionDetailsModal rendered with empty transaction details'
    )
    return null
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size={'small'}>
      <ModalHeader>
        <ModalTitle title={messages.withdrawal} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <DetailSection
          label={messages.transaction}
          value={messages.usdcWithdrawal}
        />
        <DetailSection
          label={messages.date}
          value={moment(transactionDetails.transactionDate).format('M/D/YY')}
        />
        <DetailSection
          label={messages.amountSent}
          value={`$${formatUSDCWeiToUSDString(transactionDetails.change)}`}
        />
        <DetailSection
          label={
            <ExternalLink
              variant='inherit'
              to={makeSolscanLink(transactionDetails.signature)}
            >
              <span className={styles.transactionLink}>
                {messages.destinationWallet}
                <Icon icon={IconExternalLink} />
              </span>
            </ExternalLink>
          }
          value={`${
            '28d93jkg9diwoslwoeirkfhs83uj5h8dk2kd8vjhk289dks8vn2kd8wk' ?? '-'
          }`}
        />
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <HarmonyButton
          className={styles.button}
          text={messages.done}
          onClick={onClose}
        />
      </ModalFooter>
    </Modal>
  )
}
