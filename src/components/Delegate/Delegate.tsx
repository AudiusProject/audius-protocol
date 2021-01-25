import React from 'react'
import clsx from 'clsx'

import styles from './Delegate.module.css'
import Paper from 'components/Paper'
import BN from 'bn.js'
import Tooltip, { Position } from 'components/Tooltip'
import { TICKER } from 'utils/consts'
import Button, { ButtonType } from 'components/Button'
import { IconArrowWhite } from '@audius/stems'
import { useModalControls } from 'utils/hooks'
import UpdateDelegationModal from 'components/UpdateDelegationModal'
import { Address } from 'types'
import { formatWei, formatShortAud } from 'utils/format'

const messages = {
  title: 'Manage Delegation',
  delegationLabel: `Your STAKE ${TICKER}`,
  decrease: 'DECREASE DELEGATION',
  increase: 'INCREASE DELEGATION'
}

const DecreaseDelegation = ({
  delegates,
  wallet,
  isDisabled,
  className
}: {
  delegates: BN
  wallet: Address
  isDisabled: boolean
  className?: string
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
        isIncrease={false}
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
        isIncrease
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
  return (
    <Paper className={clsx(styles.container, { [className!]: !!className })}>
      <div className={styles.title}>{messages.title} </div>
      <div className={styles.content}>
        <div className={styles.delegationContainer}>
          <Tooltip
            position={Position.TOP}
            text={formatWei(delegates)}
            className={styles.delegationValue}
          >
            {formatShortAud(delegates)}
          </Tooltip>
          <div className={styles.delegationLabel}>
            {messages.delegationLabel}
          </div>
        </div>
        <div className={styles.btnContainer}>
          <IncreaseDelegation
            wallet={wallet}
            delegates={delegates}
            isDisabled={false}
          />
          <DecreaseDelegation
            wallet={wallet}
            delegates={delegates}
            isDisabled={false}
            className={styles.decreaseBtn}
          />
        </div>
      </div>
    </Paper>
  )
}

export default DelegateSection
