import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import React from 'react'
import cn from 'classnames'
import { ModalBodyWrapper } from '../WalletModal'
import DisplayAudio from './DisplayAudio'

import styles from './ClaimingModalBody.module.css'
import { BNWei } from 'store/wallet/slice'

type ClaimingModalBodyProps = {
  balance: BNWei
}

const messages = {
  message1:
    "Please don't go anywhere. This may take a couple minutes, but it will be worth it.",
  message2:
    "You now own a small part of Audius. You can earn more just by using the platform and contributing to it's success!"
}

const ClaimingModalBody = ({ balance }: ClaimingModalBodyProps) => {
  return (
    <ModalBodyWrapper className={styles.container}>
      <DisplayAudio amount={balance} className={styles.displayAudio} />
      <LoadingSpinner className={styles.spinner} />
      <div className={cn(styles.message, styles.msgSpacing)}>
        {messages.message1}
      </div>
      <div className={cn(styles.message, styles.msgWidth)}>
        {messages.message2}
      </div>
    </ModalBodyWrapper>
  )
}

export default ClaimingModalBody
