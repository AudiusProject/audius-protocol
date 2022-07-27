import { BNWei, StringAudio, WalletAddress } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'

import { stringAudioToBN, weiToAudio } from 'common/utils/wallet'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DashboardTokenValueSlider from './DashboardTokenValueSlider'
import DisplayAudio from './DisplayAudio'
import styles from './SendInputConfirmation.module.css'

const messages = {
  title: "YOU'RE ABOUT TO SEND",
  sendButton: 'SEND $AUDIO'
}

type SendInputConfirmationProps = {
  balance: BNWei
  amountToTransfer: BNWei
  recipientAddress: WalletAddress
  onSend: () => void
}

export const AddressWithArrow = ({ address }: { address: WalletAddress }) => {
  return (
    <div className={styles.addressWrapper}>
      <IconArrow className={styles.arrow} />
      {address}
    </div>
  )
}

const SendInputConfirmation = ({
  amountToTransfer,
  balance,
  recipientAddress,
  onSend
}: SendInputConfirmationProps) => {
  return (
    <ModalBodyWrapper>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.title} />
      </div>
      <DashboardTokenValueSlider
        min={stringAudioToBN('0' as StringAudio)}
        max={weiToAudio(balance)}
        value={weiToAudio(amountToTransfer)}
      />
      <DisplayAudio amount={amountToTransfer} />
      <AddressWithArrow address={recipientAddress} />
      <div className={styles.buttonWrapper}>
        <Button
          text={messages.sendButton}
          onClick={onSend}
          type={ButtonType.PRIMARY_ALT}
        />
      </div>
    </ModalBodyWrapper>
  )
}

export default SendInputConfirmation
