import React, { useState, useCallback, useEffect } from 'react'

import { ButtonType } from '@audius/stems'
import BN from 'bn.js'

import Button from 'components/Button'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import DisplayAudio from 'components/DisplayAudio'
import Modal from 'components/Modal'
import TextField from 'components/TextField'
import { useUpdateMinimumDelegationAmount } from 'store/actions/updateMinimumDelegationAmount'
import { Status } from 'types'
import { TICKER } from 'utils/consts'
import { useModalControls } from 'utils/hooks'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'

import styles from './MinimumDelegationAmountModal.module.css'

const messages = {
  title: 'Minimum Delegation Amount',
  textLabel: 'MINIMUM DELEGATION AMOUNT',
  currentLabel: 'Current: ',
  btn: 'Change Minimum',
  confirmChange: 'Confirm Change Minimum'
}

type OwnProps = {
  minimumDelegationAmount: BN
  isOpen: boolean
  onClose: () => void
}

type MinimumDelegationAmountModalProps = OwnProps

const MinimumDelegationAmountModal: React.FC<
  MinimumDelegationAmountModalProps
> = ({
  minimumDelegationAmount,
  isOpen,
  onClose
}: MinimumDelegationAmountModalProps) => {
  const [minDelegationBN, setMinDelegationBN] = useState(new BN('0'))
  const [minDelegation, setMinDelegation] = useState('')

  const onUpdateMinimumDelegationAmount = useCallback(
    (value: string) => {
      setMinDelegation(value)
      if (checkWeiNumber(value)) {
        setMinDelegationBN(parseWeiNumber(value)!)
      }
    },
    [setMinDelegation, setMinDelegationBN]
  )

  const {
    isOpen: isConfirmModalOpen,
    onClick: onSubmit,
    onClose: onCloseConfirm
  } = useModalControls()
  const { status, updateMinimum, error } = useUpdateMinimumDelegationAmount(
    !isConfirmModalOpen
  )

  const onConfirm = useCallback(() => {
    updateMinimum(minDelegationBN)
  }, [updateMinimum, minDelegationBN])

  // Close All modals on success status
  useEffect(() => {
    if (status === Status.Success) {
      onCloseConfirm()
      onClose()
      setMinDelegationBN(new BN('0'))
      setMinDelegation('')
    }
  }, [status, onClose, onCloseConfirm])

  const topBox = (
    <StandaloneBox>
      {`${messages.confirmChange} to `}
      <DisplayAudio amount={minDelegationBN} label={TICKER} />
    </StandaloneBox>
  )

  return (
    <Modal
      title={messages.title}
      className={styles.container}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={!isConfirmModalOpen}
    >
      <div className={styles.content}>
        <TextField
          value={minDelegation}
          onChange={onUpdateMinimumDelegationAmount}
          label={messages.textLabel}
          className={styles.input}
        />
        <div className={styles.currentLabel}>
          {messages.currentLabel}
          <DisplayAudio
            className={styles.audioLabel}
            amount={minimumDelegationAmount}
            label={TICKER}
          />
        </div>
      </div>
      <Button
        text={messages.btn}
        type={ButtonType.PRIMARY}
        onClick={onSubmit}
      />
      <ConfirmTransactionModal
        isOpen={isConfirmModalOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        topBox={topBox}
        withArrow={false}
        status={status}
        error={error}
      />
    </Modal>
  )
}

export default MinimumDelegationAmountModal
