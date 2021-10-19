import React from 'react'

import { WalletAddress } from 'common/models/Wallet'

import { ModalBodyWrapper } from '../WalletModal'

import ClickableAddress from './ClickableAddress'
import styles from './ReceiveBody.module.css'

type ReceiveBodyProps = { wallet: WalletAddress }

const messages = {
  warning: 'PROCEED WITH CAUTION',
  warning2: 'If $AUDIO is sent to the wrong address it will be lost.',
  warning3: "Don't attempt to send tokens other than $AUDIO to this address.",
  yourAddress: 'YOUR ADDRESS'
}

const ReceiveBody = ({ wallet }: ReceiveBodyProps) => {
  return (
    <ModalBodyWrapper className={styles.container}>
      <div className={styles.warning}>{messages.warning}</div>
      <div className={styles.description}>
        <div>{messages.warning2}</div>
        <div>{messages.warning3}</div>
      </div>
      <ClickableAddress address={wallet} />
    </ModalBodyWrapper>
  )
}

export default ReceiveBody
