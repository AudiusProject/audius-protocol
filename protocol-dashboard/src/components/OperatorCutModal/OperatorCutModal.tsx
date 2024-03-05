import React, { useState, useCallback, useEffect } from 'react'
import { ButtonType } from '@audius/stems'
import { Flex, Text, Box } from '@audius/harmony'

import { useUpdateOperatorCut } from 'store/actions/updateOperatorCut'
import Modal from 'components/Modal'
import Button from 'components/Button'
import TextField from 'components/TextField'
import styles from './OperatorCutModal.module.css'
import { Status } from 'types'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import { useModalControls } from 'utils/hooks'

const messages = {
  title: 'Change Operator Fee',
  cutLabel: 'Operator Fee',
  currentLabel: 'Current',
  btn: 'Change Fee',
  confirmChange: 'Confirm Change Operator Fee'
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
      <Flex
        gap="l"
        mt="xl"
        alignItems="flex-end"
        w="100%"
        css={{ maxWidth: 420 }}
      >
        <Box css={{ flexGrow: 1 }}>
          <TextField
            value={operatorCut}
            onChange={onUpdateOperatorCut}
            label={messages.cutLabel}
            rightLabel={'%'}
          />
        </Box>
        <Flex direction="column" alignItems="flex-end" pb="xl">
          <Text variant="heading" size="s">
            {`${cut}%`}
          </Text>
          <Text variant="body" size="m" strength="strong" color="subdued">
            {messages.currentLabel}
          </Text>
        </Flex>
      </Flex>
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
