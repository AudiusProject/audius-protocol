import BN from 'bn.js'
import clsx from 'clsx'
import React, { useCallback, useEffect, useState } from 'react'
import { useModalControls } from 'utils/hooks'

import TrashIcon from 'assets/img/iconTrash.svg?react'
import { useDelegators } from 'store/cache/user/hooks'

import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import DisplayAudio from 'components/DisplayAudio'
import ModalTable from 'components/ModalTable'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import {
  useAccount,
  useHasPendingDecreaseDelegationTx
} from 'store/account/hooks'
import { useRemoveDelegator } from 'store/actions/removeDelegator'
import { useUndelegateStake } from 'store/actions/undelegateStake'
import { Address, Delegate, Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { accountPage } from 'utils/routes'
import styles from './DelegatorsModal.module.css'

const messages = {
  title: 'Delegators',
  modalTitle: 'Delegators',
  viewMore: 'View All Delegators',
  removeDelegator: 'Remove Delegator'
}

type Delegator = {
  img?: string
  address: string
  name?: string
  amount: BN
}

type OwnProps = {
  wallet: string
  isOpen: boolean
  onClose: () => void
}
type DelegatorsTableProps = OwnProps

type DelegatorTableRowProps = {
  onClickRow: (delegator: Delegator) => void
  delegator: Delegator
  isDelegateOwner: boolean
  isDelegatorOwner: boolean
  onClickRemoveDelegator: (e: React.MouseEvent, address: string) => void
  disableRemoveDelegator?: boolean
}

const DelegatorTableRow = ({
  onClickRow,
  delegator,
  isDelegateOwner,
  isDelegatorOwner,
  disableRemoveDelegator,
  onClickRemoveDelegator
}: DelegatorTableRowProps) => {
  return (
    <div className={styles.rowContainer} onClick={() => onClickRow(delegator)}>
      <UserImage
        className={clsx(styles.rowCol, styles.colImg)}
        wallet={delegator.address}
        alt={'User Profile'}
      />
      <UserName
        className={clsx(styles.rowCol, styles.colAddress)}
        wallet={delegator.address}
      />
      <DisplayAudio
        className={clsx(styles.rowCol, styles.colAmount)}
        amount={delegator.amount}
      />
      {(isDelegateOwner || (isDelegatorOwner && !disableRemoveDelegator)) && (
        <div
          className={clsx(styles.rowCol, styles.trashIconContainer)}
          onClick={(e: React.MouseEvent) =>
            onClickRemoveDelegator(e, delegator.address)
          }
        >
          <TrashIcon className={styles.trashIcon} />
        </div>
      )}
    </div>
  )
}

const DelegatorsTable: React.FC<DelegatorsTableProps> = ({
  wallet,
  isOpen,
  onClose
}: DelegatorsTableProps) => {
  const { delegators } = useDelegators({ wallet })
  const { wallet: accountWallet } = useAccount()
  const hasPendingDecreaseDelegationResult = useHasPendingDecreaseDelegationTx()

  const isOwner = accountWallet === wallet

  const data = (delegators as Delegate[]).map(delegator => {
    return {
      img: delegator.img,
      name: delegator.name,
      address: delegator.wallet,
      amount: delegator.amount
    }
  })

  const {
    isOpen: removeDelegatorOpen,
    onClick: openRemoveDelegator,
    onClose: onCloseRemoveDelegator
  } = useModalControls()
  const [delegatorToRemove, setDelegatorToRemove] = useState<Address>('')
  const onClickRemoveDelegator = useCallback(
    (e: React.MouseEvent, delegator: Address) => {
      e.stopPropagation()
      setDelegatorToRemove(delegator)
      openRemoveDelegator()
    },
    [setDelegatorToRemove, openRemoveDelegator]
  )

  const {
    removeDelegator,
    status: removeDelegatorStatus,
    error: removeDelegatorError
  } = useRemoveDelegator(isOpen)
  const {
    undelegateStake,
    status: undelegateStatus,
    error: undelegateError
  } = useUndelegateStake(isOpen)

  useEffect(() => {
    if (
      undelegateStatus === Status.Success ||
      removeDelegatorStatus === Status.Success
    ) {
      onCloseRemoveDelegator()
      onClose()
    }
  }, [undelegateStatus, removeDelegatorStatus, onCloseRemoveDelegator, onClose])

  const onConfirmRemoveDelegator = useCallback(() => {
    if (delegatorToRemove === accountWallet) {
      const delegator = delegators.find(d => d.wallet === accountWallet)
      const amount = delegator?.amount
      if (amount) undelegateStake(wallet, amount)
    } else {
      removeDelegator(wallet, delegatorToRemove)
    }
  }, [
    delegatorToRemove,
    accountWallet,
    delegators,
    wallet,
    undelegateStake,
    removeDelegator
  ])

  const pushRoute = usePushRoute()
  const onRowClick = useCallback(
    (row: Delegator) => {
      onClose()
      pushRoute(accountPage(row.address))
    },
    [onClose, pushRoute]
  )

  const renderTableRow = (data: Delegator) => {
    const isDelegatorOwner = data.address === accountWallet
    return (
      <DelegatorTableRow
        isDelegatorOwner={isDelegatorOwner}
        delegator={data}
        isDelegateOwner={isOwner}
        disableRemoveDelegator={
          isDelegatorOwner &&
          (hasPendingDecreaseDelegationResult.status !== Status.Success ||
            hasPendingDecreaseDelegationResult.hasPendingDecreaseTx)
        }
        onClickRow={onRowClick}
        onClickRemoveDelegator={onClickRemoveDelegator}
      />
    )
  }

  const removeDelegatorBox = (
    <StandaloneBox>
      <div>{messages.removeDelegator}</div>
      <div className={styles.subtext}>{delegatorToRemove}</div>
    </StandaloneBox>
  )
  const status =
    delegatorToRemove === accountWallet
      ? undelegateStatus
      : removeDelegatorStatus
  const error =
    delegatorToRemove === accountWallet ? undelegateError : removeDelegatorError

  return (
    <ModalTable
      title={messages.modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      dismissOnClickOutside={!removeDelegatorOpen}
    >
      {data.map(d => (
        <div
          onClick={() => onRowClick(d)}
          key={d.address}
          className={styles.modalRow}
        >
          {renderTableRow(d)}
        </div>
      ))}
      <ConfirmTransactionModal
        withArrow={false}
        topBox={removeDelegatorBox}
        isOpen={removeDelegatorOpen}
        onClose={onCloseRemoveDelegator}
        status={status}
        error={error}
        onConfirm={onConfirmRemoveDelegator}
      />
    </ModalTable>
  )
}

export default DelegatorsTable
