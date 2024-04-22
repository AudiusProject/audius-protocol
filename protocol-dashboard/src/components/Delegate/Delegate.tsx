import React from 'react'

import { IconArrowWhite } from '@audius/stems'
import BN from 'bn.js'
import clsx from 'clsx'

import Button, { ButtonType } from 'components/Button'
import DisplayAudio from 'components/DisplayAudio'
import Paper from 'components/Paper'
import { BasicTooltip, Position } from 'components/Tooltip/Tooltip'
import UpdateDelegationModal from 'components/UpdateDelegationModal'
import { useHasPendingDecreaseDelegationTx } from 'store/account/hooks'
import { usePendingClaim } from 'store/cache/claims/hooks'
import { Address, Status } from 'types'
import { TICKER } from 'utils/consts'
import { useModalControls } from 'utils/hooks'

import styles from './Delegate.module.css'

const messages = {
  title: 'Manage Delegation',
  delegationLabel: `Your STAKE ${TICKER}`,
  decrease: 'DECREASE DELEGATION',
  increase: 'INCREASE DELEGATION',
  pendingDecreaseDisabled:
    'Not Permitted While A Decrease Delegation Is Pending',
  pendingClaimDisabled: 'Not Permitted While A Claim Is Pending'
}

const DecreaseDelegation = ({
  delegates,
  wallet,
  isDisabled
}: {
  delegates: BN
  wallet: Address
  isDisabled: boolean
}) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const decreaseIcon = <IconArrowWhite className={styles.decreaseIcon} />
  return (
    <>
      <Button
        type={ButtonType.PRIMARY_ALT}
        onClick={onClick}
        leftIcon={decreaseIcon}
        text={messages.decrease}
        isDisabled={isDisabled}
        iconClassName={styles.stakeIcon}
        textClassName={styles.stakeBtnText}
        className={clsx(styles.modifyStakeBtn, {
          [styles.disabledBtn]: isDisabled
        })}
      />
      <UpdateDelegationModal
        wallet={wallet}
        delegates={delegates}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  )
}

const IncreaseDelegation = ({
  delegates,
  wallet,
  isDisabled
}: {
  delegates: BN
  wallet: Address
  isDisabled: boolean
}) => {
  const increaseIcon = <IconArrowWhite className={styles.increaseIcon} />
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <>
      <Button
        onClick={onClick}
        type={ButtonType.PRIMARY_ALT}
        leftIcon={increaseIcon}
        text={messages.increase}
        isDisabled={isDisabled}
        iconClassName={styles.stakeIcon}
        textClassName={styles.stakeBtnText}
        className={clsx(styles.modifyStakeBtn, styles.increaseBtn, {
          [styles.disabledBtn]: isDisabled
        })}
      />
      <UpdateDelegationModal
        wallet={wallet}
        delegates={delegates}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  )
}

type OwnProps = {
  className?: string
  wallet: Address
  delegates: BN
}
type DelegateSectionProps = OwnProps

const DelegateSection: React.FC<DelegateSectionProps> = ({
  className,
  wallet,
  delegates
}: DelegateSectionProps) => {
  const { hasClaim, status: claimStatus } = usePendingClaim(wallet)
  const useHasPendingDecrease = useHasPendingDecreaseDelegationTx()
  const isDecreaseDelegationDisabled =
    useHasPendingDecrease.status !== Status.Success ||
    useHasPendingDecrease.hasPendingDecreaseTx ||
    claimStatus !== Status.Success ||
    hasClaim
  const isIncreaseDelegationDisabled =
    claimStatus !== Status.Success || hasClaim
  return (
    <Paper className={clsx(styles.container, { [className!]: !!className })}>
      <div className={styles.title}>{messages.title} </div>
      <div className={styles.content}>
        <div className={styles.delegationContainer}>
          <DisplayAudio
            position={Position.TOP}
            className={styles.delegationValue}
            amount={delegates}
            shortFormat
          />
          <div className={styles.delegationLabel}>
            {messages.delegationLabel}
          </div>
        </div>
        <div className={styles.btnContainer}>
          <BasicTooltip
            position={Position.TOP}
            text={messages.pendingClaimDisabled}
            isDisabled={!isIncreaseDelegationDisabled}
            className={styles.delegateBtnTooltip}
          >
            <IncreaseDelegation
              wallet={wallet}
              delegates={delegates}
              isDisabled={isIncreaseDelegationDisabled}
            />
          </BasicTooltip>
          <BasicTooltip
            position={Position.TOP}
            text={
              useHasPendingDecrease.hasPendingDecreaseTx
                ? messages.pendingDecreaseDisabled
                : messages.pendingClaimDisabled
            }
            isDisabled={!isDecreaseDelegationDisabled}
            className={styles.delegateBtnTooltip}
          >
            <DecreaseDelegation
              wallet={wallet}
              delegates={delegates}
              isDisabled={isDecreaseDelegationDisabled}
            />
          </BasicTooltip>
        </div>
      </div>
    </Paper>
  )
}

export default DelegateSection
