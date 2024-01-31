import { tokenDashboardPageSelectors } from '@audius/common/store'

import { useEffect, useState } from 'react'

import {} from '@audius/common'
import { StringAudio, BNWei, WalletAddress } from '@audius/common/models'
import { weiToAudio, stringAudioToBN } from '@audius/common/utils'
import { Button, ButtonType, IconArrow } from '@audius/stems'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DashboardTokenValueSlider from './DashboardTokenValueSlider'
import DisplayAudio from './DisplayAudio'
import styles from './SendInputConfirmation.module.css'
const { getCanRecipientReceiveWAudio } = tokenDashboardPageSelectors

const messages = {
  title: "YOU'RE ABOUT TO SEND",
  sendButton: 'SEND $AUDIO',
  errorMessage:
    'The destination Solana address does not contain enough SOL to create an $AUDIO wallet.'
}

const LOADING_DURATION = 1000

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
  const [hasLoadingDurationElapsed, setHasLoadingDurationElapsed] =
    useState(false)
  const canRecipientReceiveWAudio = useSelector(getCanRecipientReceiveWAudio)
  const isLongLoading =
    hasLoadingDurationElapsed && canRecipientReceiveWAudio === 'loading'

  // State to help determine whether to show a loading spinner,
  // for example if Solana is being slow
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoadingDurationElapsed(true)
    }, LOADING_DURATION)
    return () => clearTimeout(timer)
  })

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
          onClick={canRecipientReceiveWAudio === 'true' ? onSend : undefined}
          type={ButtonType.PRIMARY_ALT}
          disabled={canRecipientReceiveWAudio === 'false' || isLongLoading}
          rightIcon={
            isLongLoading ? (
              <LoadingSpinner className={styles.loadingSpinner} />
            ) : null
          }
        />
      </div>
      {canRecipientReceiveWAudio === 'false' ? (
        <div className={styles.errorMessage}>{messages.errorMessage}</div>
      ) : null}
    </ModalBodyWrapper>
  )
}

export default SendInputConfirmation
