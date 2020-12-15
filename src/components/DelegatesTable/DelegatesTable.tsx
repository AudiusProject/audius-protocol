import React, { useCallback } from 'react'
import clsx from 'clsx'
import { usePushRoute } from 'utils/effects'

import { accountPage } from 'utils/routes'
import { useDelegates } from 'store/cache/user/hooks'
import { useModalControls } from 'utils/hooks'
import Table from 'components/Table'
import styles from './DelegatesTable.module.css'
import AudiusClient from 'services/Audius'
import { Delegate, Address } from 'types'
import DelegatesModal from 'components/DelegatesModal'
import Tooltip from 'components/Tooltip'
import { formatShortWallet, formatWei } from 'utils/format'
import BN from 'bn.js'

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
  const data = (delegates as Delegate[]).map(delegate => {
    return {
      img: delegate.img,
      address: delegate.wallet,
      amount: delegate.amount,
      activeAmount: delegate.activeAmount
    }
  })
  const columns = [
    { title: 'Amount Delegated', className: styles.amountHeader }
  ]

  const renderRow = (data: Delegator) => {
    return (
      <div className={styles.rowContainer}>
        <img
          className={clsx(styles.rowCol, styles.colImg)}
          src={data.img}
          alt={'User Profile'}
        />
        <div className={clsx(styles.rowCol, styles.colAddress)}>
          {data.name || formatShortWallet(data.address)}
        </div>
        <Tooltip
          className={clsx(styles.rowCol, styles.colAmount)}
          text={formatWei(data.activeAmount)}
        >
          {AudiusClient.displayShortAud(data.activeAmount)}
        </Tooltip>
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
