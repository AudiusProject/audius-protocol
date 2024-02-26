import React, { useState, useCallback, useEffect } from 'react'

import { ButtonType } from '@audius/stems'
import BN from 'bn.js'
import clsx from 'clsx'

import Button from 'components/Button'
import ConfirmTransactionModal, {
  OldStake,
  NewStake
} from 'components/ConfirmTransactionModal'
import DisplayAudio from 'components/DisplayAudio'
import Modal from 'components/Modal'
import TextField from 'components/TextField'
import { Position } from 'components/Tooltip'
import ValueSlider from 'components/ValueSlider'
import AudiusClient from 'services/Audius'
import { useAccountUser } from 'store/account/hooks'
import { useUpdateStake } from 'store/actions/updateStake'
import { Status, Operator } from 'types'
import { TICKER } from 'utils/consts'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'

import styles from './UpdateStakeModal.module.css'

const messages = {
  increaseTitle: 'Increase Stake',
  increaseBtn: 'Increase Stake',
  decreaseTitle: 'Decrease Stake',
  decreaseBtn: 'Decrease Stake',
  currentStake: 'Current Stake',
  change: 'Change',
  newStakingAmount: 'New Staking Amount',
  stakingLabel: TICKER,
  oldStakeTitle: `Old Stake ${TICKER}`,
  newStakeTitle: `New Stake ${TICKER}`
}

type OwnProps = {
  isOpen: boolean
  isIncrease: boolean
  onClose: () => void
}

type IncreaseStakeModalProps = OwnProps

const IncreaseStakeModal: React.FC<IncreaseStakeModalProps> = ({
  isOpen,
  isIncrease,
  onClose
}: IncreaseStakeModalProps) => {
  const { status: userStatus, user: accountUser } = useAccountUser()
  if (userStatus === Status.Success && !('serviceProvider' in accountUser)) {
    // This should have never been opened b/c the user is not a service provider
    onClose()
  }

  const [stakingBN, setStakingBN] = useState(new BN('0'))
  const [stakingAmount, setStakingAmount] = useState('0')
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setHasRun(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (
      userStatus === Status.Success &&
      'serviceProvider' in accountUser &&
      !hasRun
    ) {
      setHasRun(true)
      const deployerStake = (accountUser as Operator).serviceProvider
        .deployerStake
      setStakingBN(deployerStake)
      setStakingAmount(AudiusClient.getAud(deployerStake).toString())
    }
  }, [
    userStatus,
    accountUser,
    setStakingAmount,
    setStakingBN,
    hasRun,
    setHasRun
  ])

  const onUpdateStaking = useCallback(
    (value: string) => {
      setStakingAmount(value)
      if (checkWeiNumber(value)) {
        setStakingBN(parseWeiNumber(value)!)
      }
    },
    [setStakingAmount, setStakingBN]
  )

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const onCloseConfirm = useCallback(() => setIsConfirmModalOpen(false), [])

  const onSubmit = useCallback(() => {
    // TODO: validate each field
    setIsConfirmModalOpen(true)
  }, [setIsConfirmModalOpen])

  const { status, updateStake, error } = useUpdateStake(
    isIncrease,
    !isConfirmModalOpen
  )

  const onConfirm = useCallback(() => {
    const deployerStake = (accountUser as Operator).serviceProvider
      .deployerStake

    if (isIncrease) {
      updateStake(stakingBN.sub(deployerStake))
    } else {
      updateStake(deployerStake.sub(stakingBN))
    }
  }, [isIncrease, updateStake, accountUser, stakingBN])

  // Close All modals on success status
  useEffect(() => {
    if (status === Status.Success) {
      onCloseConfirm()
      onClose()
    }
  }, [status, onClose, onCloseConfirm])

  const oldStakeAmount =
    (accountUser as Operator)?.serviceProvider?.deployerStake ?? null
  const stakeDiff = oldStakeAmount
    ? isIncrease
      ? stakingBN.sub(oldStakeAmount)
      : oldStakeAmount.sub(stakingBN)
    : null

  const topBox = (
    <OldStake
      title={messages.oldStakeTitle}
      stakeDiff={stakeDiff}
      isIncrease={isIncrease}
      oldStakeAmount={oldStakeAmount}
    />
  )
  const bottomBox = (
    <NewStake title={messages.newStakeTitle} stakeAmount={stakingBN} />
  )
  const deployerStake =
    (accountUser as Operator)?.serviceProvider?.deployerStake ?? new BN('0')
  const totalStakedFor =
    (accountUser as Operator)?.totalStakedFor ?? new BN('0')

  const stakeChange = stakingBN.sub(deployerStake)
  const min = isIncrease
    ? deployerStake
    : (accountUser as Operator)?.serviceProvider?.minAccountStake
  const max = isIncrease
    ? (accountUser as Operator)?.serviceProvider?.maxAccountStake
        .sub(totalStakedFor)
        .add(deployerStake)
    : deployerStake

  return (
    <Modal
      title={isIncrease ? messages.increaseTitle : messages.decreaseTitle}
      className={styles.container}
      wrapperClassName={styles.wrapperClassName}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={!isConfirmModalOpen}
    >
      <div className={styles.content}>
        <ValueSlider
          isIncrease={isIncrease}
          min={min}
          max={max}
          value={stakingBN}
          initialValue={deployerStake}
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
                min && max && (stakingBN.gt(max) || stakingBN.lt(min))
            })}
            rightLabel={messages.stakingLabel}
          />
          <div className={styles.stakingChange}>
            <div className={styles.stakingRow}>
              <div className={styles.stakingLabel}>Current Staking:</div>
              <DisplayAudio
                className={styles.stakingValue}
                amount={deployerStake}
                label={TICKER}
              />
            </div>
            <div className={styles.stakingRow}>
              <div className={styles.stakingLabel}>Change:</div>
              <DisplayAudio
                position={Position.BOTTOM}
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
          onClick={onSubmit}
        />
      </div>
      <ConfirmTransactionModal
        isOpen={isConfirmModalOpen}
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

export default IncreaseStakeModal
