import { WalletAddress } from '@audius/common/models'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'

import PurpleBox from 'components/rewards/PurpleBox'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DisplayAudio from './DisplayAudio'
import { AddressWithArrow } from './SendInputConfirmation'
import styles from './SendInputSuccess.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

type SendInputSuccessProps = {
  sentAmount: AudioWei
  recipientAddress: WalletAddress
  balance: AudioWei
}

const messages = {
  success: 'YOU HAVE SUCCESSFULLY SENT',
  note: 'Note: The $AUDIO may take a couple minutes to show up',
  newBalance: 'YOUR BALANCE IS NOW',
  currency: '$AUDIO'
}

const SendInputSuccess = ({
  sentAmount,
  recipientAddress,
  balance
}: SendInputSuccessProps) => {
  return (
    <ModalBodyWrapper>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.success} />
      </div>
      <DisplayAudio amount={sentAmount} />
      <AddressWithArrow address={recipientAddress} />
      <div className={styles.noteWrapper}>{messages.note}</div>
      <PurpleBox
        className={styles.box}
        label={messages.newBalance}
        text={
          <>
            <TokenHoverTooltip balance={balance}>
              <span className={styles.amount}>
                {AUDIO(balance).trunc().toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </span>
            </TokenHoverTooltip>
            <span className={styles.label}>{messages.currency}</span>
          </>
        }
      />
    </ModalBodyWrapper>
  )
}

export default SendInputSuccess
