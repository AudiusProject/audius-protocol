import { BNWei, WalletAddress } from '@audius/common/models'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DisplayAudio from './DisplayAudio'
import { AddressWithArrow } from './SendInputConfirmation'
import styles from './SendingModalBody.module.css'

type SendingModalBodyProps = {
  amountToTransfer: BNWei
  recipientAddress: WalletAddress
}

const messages = {
  title: 'SENDING',
  message: "Please don't go anywhere. This may take a little while."
}

const SendingModalBody = ({
  amountToTransfer,
  recipientAddress
}: SendingModalBodyProps) => {
  return (
    <ModalBodyWrapper className={styles.container}>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.title} />
      </div>
      <DisplayAudio amount={amountToTransfer} className={styles.displayAudio} />
      <AddressWithArrow address={recipientAddress} />
      <LoadingSpinner className={styles.spinner} />
      <div className={cn(styles.message, styles.msgWidth)}>
        {messages.message}
      </div>
    </ModalBodyWrapper>
  )
}

export default SendingModalBody
