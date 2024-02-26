import React, { useCallback } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import DelegatesModal from 'components/DelegatesModal'
import DisplayAudio from 'components/DisplayAudio'
import Table from 'components/Table'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import { useDelegates } from 'store/cache/user/hooks'
import { Delegate, Address } from 'types'
import { usePushRoute } from 'utils/effects'
import { useModalControls } from 'utils/hooks'
import { accountPage } from 'utils/routes'

import styles from './DelegatesTable.module.css'

const messages = {
  title: 'Delegates',
  viewMore: 'View All Delegates',
  modalTitle: 'Delegates'
}

type Delegator = {
  img: string
  name?: string
  address: Address
  amount: BN
  activeAmount: BN
}

type OwnProps = {
  className?: string
  limit?: number
  wallet: string
}
type DelegatesTableProps = OwnProps

const DelegatesTable: React.FC<DelegatesTableProps> = ({
  className,
  wallet,
  limit
}: DelegatesTableProps) => {
  const { delegates } = useDelegates({ wallet })

  const pushRoute = usePushRoute()
  const data = (delegates as Delegate[]).map((delegate) => {
    return {
      img: delegate.img,
      address: delegate.wallet,
      amount: delegate.amount,
      name: delegate.name,
      activeAmount: delegate.activeAmount
    }
  })
  const columns = [
    { title: 'Amount Delegated', className: styles.amountHeader }
  ]

  const renderRow = (data: Delegator) => {
    return (
      <div className={styles.rowContainer}>
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
          amount={data.activeAmount}
        />
      </div>
    )
  }

  const { isOpen, onClick: onClickMore, onClose } = useModalControls()

  const onRowClick = useCallback(
    (row: Delegator) => pushRoute(accountPage(row.address)),
    [pushRoute]
  )

  if (data.length === 0) {
    return null
  }
  return (
    <>
      <Table
        className={className}
        title={messages.title}
        columns={columns}
        data={data}
        limit={limit}
        renderRow={renderRow}
        onRowClick={onRowClick}
        onClickMore={onClickMore}
        moreText={messages.viewMore}
        alwaysShowMore
      />
      <DelegatesModal isOpen={isOpen} onClose={onClose} wallet={wallet} />
    </>
  )
}

export default DelegatesTable
