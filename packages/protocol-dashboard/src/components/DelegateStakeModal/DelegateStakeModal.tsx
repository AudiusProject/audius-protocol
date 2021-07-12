import React, { useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { Utils } from '@audius/libs'
import { ButtonType } from '@audius/stems'

import { useDelegateStake } from 'store/actions/delegateStake'
import { useUserDelegation } from 'store/actions/userDelegation'
import AudiusClient from 'services/Audius'
import Modal from 'components/Modal'
import Button from 'components/Button'
import ValueSlider from 'components/ValueSlider'
import TextField from 'components/TextField'
import styles from './DelegateStakeModal.module.css'
import { Status, Address } from 'types'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'
import ConfirmTransactionModal, {
  Delegating,
  ToOperator
} from 'components/ConfirmTransactionModal'
import { useModalControls } from 'utils/hooks'
import { formatShortWallet } from 'utils/format'
import { TICKER } from 'utils/consts'

const messages = {
  title: 'Delegate to Operator',
  amountLabel: 'Delegate Amount',
  btn: 'Delegate',
  inputLabel: TICKER
}

type OwnProps = {
  serviceOperatorWallet: Address
  isOpen: boolean
  onClose: () => void
}

type DelegateStakeModalProps = OwnProps

const DelegateStakeModal: React.FC<DelegateStakeModalProps> = ({
  serviceOperatorWallet,
  isOpen,
  onClose
}: DelegateStakeModalProps) => {
  const { min, max, user } = useUserDelegation(serviceOperatorWallet)
  const [stakingBN, setStakingBN] = useState(Utils.toBN('0'))
  const [stakingAmount, setStakingAmount] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setStakingAmount('')
      setStakingBN(Utils.toBN('0'))
    }
  }, [isOpen, setStakingAmount, setStakingBN])

  useEffect(() => {
    if (min && stakingBN.isZero()) {
      setStakingBN(min)
      setStakingAmount(AudiusClient.getAud(min).toString())
    }
  }, [min, stakingBN, setStakingAmount, setStakingBN])

  const onUpdateStaking = useCallback(
    (value: string) => {
      setStakingAmount(value)
      if (checkWeiNumber(value)) {
        setStakingBN(parseWeiNumber(value))
      }
    },
    [setStakingAmount]
  )

  const {
    isOpen: isConfirmationOpen,
    onClick: onOpenConfirmation,
    onClose: onCloseConfirmation
  } = useModalControls()

  const onDelegate = useCallback(() => {
    if (min.lte(stakingBN) && max.gte(stakingBN)) {
      onOpenConfirmation()
    }
  }, [min, max, stakingBN, onOpenConfirmation])

  const { status, delegateStake, error } = useDelegateStake(!isConfirmationOpen)

  // Close All modals on success status
  useEffect(() => {
    if (status === Status.Success) {
      onCloseConfirmation()
      onClose()
    }
  }, [status, onCloseConfirmation, onClose])

  const onConfirm = useCallback(() => {
    delegateStake(serviceOperatorWallet, stakingBN)
  }, [serviceOperatorWallet, delegateStake, stakingBN])

  const topBox = <Delegating amount={stakingBN} />
  const bottomBox = (
    <ToOperator
      image={user?.image ?? ''}
      name={user?.name || formatShortWallet(user?.wallet ?? '')}
      wallet={serviceOperatorWallet}
    />
  )

  return (
    <Modal
      title={messages.title}
      className={styles.container}
      wrapperClassName={styles.wrapperClassName}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={!isConfirmationOpen}
    >
      <ValueSlider
        min={min}
        max={max}
        value={stakingBN}
        className={styles.slider}
      />
      <TextField
        value={stakingAmount}
        isNumeric
        label={messages.amountLabel}
        onChange={onUpdateStaking}
        className={clsx(styles.input, {
          [styles.invalid]:
            min && max && (stakingBN.gt(max) || stakingBN.lt(min))
        })}
        rightLabel={messages.inputLabel}
      />
      <Button
        text={messages.btn}
        type={ButtonType.PRIMARY}
        onClick={onDelegate}
      />
      <ConfirmTransactionModal
        isOpen={isConfirmationOpen}
        onClose={onCloseConfirmation}
        onConfirm={onConfirm}
        topBox={topBox}
        bottomBox={bottomBox}
        status={status}
        error={error}
      />
    </Modal>
  )
}

export default DelegateStakeModal
