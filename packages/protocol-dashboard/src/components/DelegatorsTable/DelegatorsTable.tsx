import React, { useCallback } from 'react'
import clsx from 'clsx'
import BN from 'bn.js'

import { usePushRoute } from 'utils/effects'
import { useModalControls } from 'utils/hooks'
import { accountPage } from 'utils/routes'
import { useUser, useDelegators } from 'store/cache/user/hooks'

import Table from 'components/Table'
import styles from './DelegatorsTable.module.css'
import AudiusClient from 'services/Audius'
import { Operator, Address, Delegate } from 'types'
import DelegatorsModal from 'components/DelegatorsModal'
import Tooltip from 'components/Tooltip'
import { formatShortWallet, formatWei } from 'utils/format'

const messages = {
  title: 'Delegators',
  modalTitle: 'Delegators',
  viewMore: 'View All Delegators',
  removeDelegator: 'Remove Delegator'
}

const limit = 5

type Delegator = {
  img: string
  address: Address
  name: string | undefined
  amount: BN
  activeAmount: BN
}

type OwnProps = {
  className?: string
  wallet: string
}
type DelegatorsTableProps = OwnProps

const DelegatorsTable: React.FC<DelegatorsTableProps> = ({
  className,
  wallet
}: DelegatorsTableProps) => {
  const { delegators } = useDelegators({ wallet })
  const { user } = useUser({ wallet })

  const pushRoute = usePushRoute()
  const data = (delegators as Delegate[]).map(delegator => {
    return {
      img: delegator.img,
      name: delegator.name,
      address: delegator.wallet,
      amount: delegator.amount,
      activeAmount: delegator.activeAmount
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

  const onRowClick = useCallback(
    (row: Delegator) => {
      // Go to delegator
      pushRoute(accountPage(row.address))
    },
    [pushRoute]
  )

  const { isOpen, onClick: onClickMore, onClose } = useModalControls()

  const label = `Deployer Cut ${
    (user as Operator).serviceProvider.deployerCut
  }%`

  return (
    <>
      <Table
        className={className}
        title={messages.title}
        label={label}
        columns={columns}
        data={data}
        limit={limit}
        renderRow={renderRow}
        onRowClick={onRowClick}
        onClickMore={onClickMore}
        moreText={messages.viewMore}
        alwaysShowMore
      />
      <DelegatorsModal isOpen={isOpen} onClose={onClose} wallet={wallet} />
    </>
  )
}

export default DelegatorsTable
