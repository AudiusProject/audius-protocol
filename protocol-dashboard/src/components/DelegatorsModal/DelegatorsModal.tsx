import React, { useCallback, useState, useEffect } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import TrashIcon from 'assets/img/iconTrash.svg?react'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import DisplayAudio from 'components/DisplayAudio'
import ModalTable from 'components/ModalTable'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import { useAccount } from 'store/account/hooks'
import { useRemoveDelegator } from 'store/actions/removeDelegator'
import { useUndelegateStake } from 'store/actions/undelegateStake'
import { useDelegators } from 'store/cache/user/hooks'
import { Address, Delegate, Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { useModalControls } from 'utils/hooks'
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

const DelegatorsTable: React.FC<DelegatorsTableProps> = ({
  wallet,
  isOpen,
  onClose
}: DelegatorsTableProps) => {
  const { delegators } = useDelegators({ wallet })
  const { wallet: accountWallet } = useAccount()

  const isOwner = accountWallet === wallet

  const data = (delegators as Delegate[]).map((delegator) => {
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
      const delegator = delegators.find((d) => d.wallet === accountWallet)
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
    return (
      <div className={styles.rowContainer} onClick={() => onRowClick(data)}>
        <UserImage
          className={clsx(styles.rowCol, styles.colImg)}
          wallet={data.address}
          alt={'User Profile'}
        />
        <UserName
          className={clsx(styles.rowCol, styles.colAddress)}
          wallet={data.address}
        />
        <DisplayAudio
          className={clsx(styles.rowCol, styles.colAmount)}
          amount={data.amount}
        />
        {(isOwner || data.address === accountWallet) && (
          <div
            className={clsx(styles.rowCol, styles.trashIconContainer)}
            onClick={(e: React.MouseEvent) =>
              onClickRemoveDelegator(e, data.address)
            }
          >
            <TrashIcon className={styles.trashIcon} />
          </div>
        )}
      </div>
    )
  }

  const count = data.length
  const modalHeader = `${count} Addresses`

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
      header={modalHeader}
      isOpen={isOpen}
      onClose={onClose}
      dismissOnClickOutside={!removeDelegatorOpen}
    >
      {data.map((d) => (
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
