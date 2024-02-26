import React, { useState, useCallback, useEffect } from 'react'

import { ButtonType } from '@audius/stems'

import Button from 'components/Button'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import Modal from 'components/Modal'
import TextField from 'components/TextField'
import { useUpdateOperatorCut } from 'store/actions/updateOperatorCut'
import { Status } from 'types'
import { useModalControls } from 'utils/hooks'

import styles from './OperatorCutModal.module.css'

const messages = {
  title: 'Change Deployer Cut',
  cutLabel: 'New Deployer Cut',
  currentLabel: 'Current Deployer Cut',
  btn: 'Change Deployer Cut',
  confirmChange: 'Confirm Change Deployer Cut'
}

type OwnProps = {
  cut: number
  isOpen: boolean
  onClose: () => void
}

type OperatorCutModalProps = OwnProps

const OperatorCutModal: React.FC<OperatorCutModalProps> = ({
  cut,
  isOpen,
  onClose
}: OperatorCutModalProps) => {
  const [operatorCut, setOperatorCut] = useState('')
  const [operatorCutNumber, setOperatorCutNumber] = useState(0)

  const onUpdateOperatorCut = useCallback(
    (value: string) => {
      const num = parseInt(value)
      if (!isNaN(num)) setOperatorCutNumber(num)
      if (value === '' || (!isNaN(num) && num.toString() === value))
        setOperatorCut(value)
    },
    [setOperatorCut]
  )

  const {
    isOpen: isConfirmModalOpen,
    onClick: onSubmit,
    onClose: onCloseConfirm
  } = useModalControls()
  const { status, updateOperatorCut, error } = useUpdateOperatorCut(
    !isConfirmModalOpen
  )

  const onConfirm = useCallback(() => {
    updateOperatorCut(operatorCutNumber)
  }, [updateOperatorCut, operatorCutNumber])

  // Close All modals on success status
  useEffect(() => {
    if (status === Status.Success) {
      onCloseConfirm()
      onClose()
      setOperatorCut('')
      setOperatorCutNumber(0)
    }
  }, [status, onClose, onCloseConfirm])

  const topBox = (
    <StandaloneBox>{`${messages.confirmChange} to ${operatorCut}%`}</StandaloneBox>
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
          value={operatorCut}
          onChange={onUpdateOperatorCut}
          label={messages.cutLabel}
          className={styles.input}
        />
        <div className={styles.currentLabel}>
          {`${messages.currentLabel}: ${cut}%`}
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

export default OperatorCutModal
