import React, { useState, useCallback, useEffect } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import Button, { ButtonType } from 'components/Button'
import ConfirmTransactionModal, {
  OldStake,
  NewStake
} from 'components/ConfirmTransactionModal'
import DisplayAudio from 'components/DisplayAudio'
import Modal from 'components/Modal'
import TextField from 'components/TextField'
import ValueSlider from 'components/ValueSlider'
import AudiusClient from 'services/Audius'
import useUpdateDelegation from 'store/actions/updateDelegation'
import { useUserDelegation } from 'store/actions/userDelegation'
import { Status, Address } from 'types'
import { TICKER } from 'utils/consts'
import { useModalControls } from 'utils/hooks'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'

import styles from './UpdateDelegationModal.module.css'

const messages = {
  increaseTitle: 'Increase Delegation',
  increaseBtn: 'Increase Delegation',
  decreaseTitle: 'Decrease Delegation',
  decreaseBtn: 'Decrease Delegation',
  currentDelegation: 'Current Delegation',
  change: 'Change',
  newStakingAmount: 'New Delegation Amount',
  stakingLabel: TICKER,
  oldDelegation: `Old  Delegation ${TICKER}`,
  newDelegation: `New  Delegation ${TICKER}`
}

type OwnProps = {
  wallet: Address
  delegates: BN
  isOpen: boolean
  isIncrease: boolean
  onClose: () => void
}

type UpdateDelegationModalProps = OwnProps

const UpdateDelegationModal: React.FC<UpdateDelegationModalProps> = ({
  delegates,
  isOpen,
  isIncrease,
  onClose,
  wallet
}: UpdateDelegationModalProps) => {
  const { min, max } = useUserDelegation(wallet)
  const [stakingBN, setStakingBN] = useState(delegates)
  const [stakingAmount, setStakingAmount] = useState(
    AudiusClient.getAud(delegates).toString()
  )

  useEffect(() => {
    setStakingBN(delegates)
    setStakingAmount(AudiusClient.getAud(delegates).toString())
  }, [setStakingAmount, setStakingBN, delegates])

  const onUpdateStaking = useCallback(
    (value: string) => {
      setStakingAmount(value)
      if (checkWeiNumber(value)) {
        setStakingBN(parseWeiNumber(value)!)
      }
    },
    [setStakingAmount, setStakingBN]
  )

  const {
    isOpen: isConfirmOpen,
    onClick: onClickConfirm,
    onClose: onCloseConfirm
  } = useModalControls()

  const { status, updateDelegation, error } = useUpdateDelegation(
    isIncrease,
    !isConfirmOpen
  )

  const onConfirm = useCallback(() => {
    if (isIncrease) {
      updateDelegation(wallet, stakingBN.sub(delegates))
    } else {
      updateDelegation(wallet, delegates.sub(stakingBN))
    }
  }, [isIncrease, updateDelegation, wallet, delegates, stakingBN])

  // Close All modals on success status
  useEffect(() => {
    if (status === Status.Success) {
      onCloseConfirm()
      onClose()
    }
  }, [status, onClose, onCloseConfirm])

  const stakeDiff = delegates
    ? isIncrease
      ? stakingBN.sub(delegates)
      : delegates.sub(stakingBN)
    : null

  const topBox = (
    <OldStake
      title={messages.oldDelegation}
      stakeDiff={stakeDiff}
      isIncrease={isIncrease}
      oldStakeAmount={delegates}
    />
  )
  const bottomBox = (
    <NewStake title={messages.newDelegation} stakeAmount={stakingBN} />
  )

  const stakeChange = stakingBN.sub(delegates)

  const valueSliderMin = isIncrease ? delegates : min
  const valueSliderMax = isIncrease ? max.add(delegates) : delegates

  return (
    <Modal
      title={isIncrease ? messages.increaseTitle : messages.decreaseTitle}
      className={styles.container}
      wrapperClassName={styles.wrapperClassName}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={!isConfirmOpen}
    >
      <div className={styles.content}>
        <ValueSlider
          isIncrease={isIncrease}
          min={valueSliderMin}
          max={valueSliderMax}
          value={stakingBN}
          initialValue={delegates}
          className={styles.slider}
        />
        <div className={styles.stakingFieldsContainer}>
          <TextField
            value={stakingAmount}
            isNumeric
            label={messages.newStakingAmount}
            onChange={onUpdateStaking}
            className={clsx(styles.input, {
              [styles.invalid]:
                valueSliderMin &&
                valueSliderMax &&
                (stakingBN.gt(valueSliderMax) || stakingBN.lt(valueSliderMin))
            })}
            rightLabel={messages.stakingLabel}
          />
          <div className={styles.stakingChange}>
            <div className={styles.stakingRow}>
              <div className={styles.stakingLabel}>Current Staking:</div>
              <DisplayAudio
                className={styles.stakingValue}
                amount={delegates}
                label={TICKER}
              />
            </div>
            <div className={styles.stakingRow}>
              <div className={styles.stakingLabel}>Change:</div>
              <DisplayAudio
                className={clsx(styles.stakingValue, styles.changeValue)}
                amount={stakeChange}
                label={TICKER}
              />
            </div>
          </div>
        </div>
        <Button
          text={isIncrease ? messages.increaseBtn : messages.decreaseBtn}
          type={ButtonType.PRIMARY}
          onClick={onClickConfirm}
        />
      </div>
      <ConfirmTransactionModal
        isOpen={isConfirmOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        topBox={topBox}
        bottomBox={bottomBox}
        status={status}
        error={error}
      />
    </Modal>
  )
}

export default UpdateDelegationModal
