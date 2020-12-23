import React, { useCallback } from 'react'
import clsx from 'clsx'
import Audius from 'services/Audius'
import { SERVICES_SERVICE_PROVIDERS, accountPage } from 'utils/routes'

import styles from './TopOperatorsTable.module.css'
import Table from 'components/Table'
import Tooltip from 'components/Tooltip'
import { formatShortWallet, formatWei } from 'utils/format'

import { useUsers } from 'store/cache/user/hooks'
import { Address, Operator, Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'
import getActiveStake, { getTotalActiveDelegatedStake } from 'utils/activeStake'
import BN from 'bn.js'

const messages = {
  topAddresses: 'Top Service Operators by Active Stake',
  viewMoreAddress: 'View Leaderboard'
}

type TableUser = {
  rank: number
  img: string
  name?: string
  wallet: Address
  staked: BN
  voteWeight: number
  proposedVotes: number
}

type OwnProps = {
  className?: string
  limit?: number
  alwaysShowMore?: boolean
}

type TopOperatorsTableProps = OwnProps

const TopOperatorsTable: React.FC<TopOperatorsTableProps> = ({
  className,
  limit,
  alwaysShowMore
}: TopOperatorsTableProps) => {
  const isMobile = useIsMobile()
  const pushRoute = usePushRoute()
  const onClickMore = useCallback(() => {
    pushRoute(SERVICES_SERVICE_PROVIDERS)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: TableUser) => {
      pushRoute(accountPage(row.wallet))
    },
    [pushRoute]
  )

  const { status, users } = useUsers({ limit, filter: 'isOperator' })

  let columns = [{ title: 'Rank', className: styles.rankColumn }]
  if (!isMobile) {
    columns = columns.concat([
      { title: 'Staked + Delegated', className: styles.totalStakedColumn }
    ])
  }

  const data = (users as Operator[])
    .map((user, idx) => {
      const activeStake = getActiveStake(user)
      const totalActiveDelegated = getTotalActiveDelegatedStake(user)
      const totalCurrentStake = activeStake.add(totalActiveDelegated)
      return {
        rank: idx + 1,
        img: user.image,
        name: user.name,
        wallet: user.wallet,
        staked: totalCurrentStake
      }
    })
    .sort((a, b) => {
      const val = b.staked.sub(a.staked)
      if (val.isZero()) return 0
      else if (val.isNeg()) return -1
      return 1
    })

  const renderRow = (data: TableUser) => {
    return (
      <div className={styles.rowContainer}>
        <div className={clsx(styles.rowCol, styles.colRank)}>{data.rank}</div>
        <img
          className={clsx(styles.rowCol, styles.colImg)}
          src={data.img}
          alt={'User Profile'}
        />
        <div className={clsx(styles.rowCol, styles.colAddress)}>
          {data.name || formatShortWallet(data.wallet)}
        </div>
        {!isMobile && (
          <>
            <Tooltip
              className={clsx(styles.rowCol, styles.totalStakedColumn)}
              text={formatWei(data.staked)}
            >
              {Audius.displayShortAud(data.staked)}
            </Tooltip>
          </>
        )}
      </div>
    )
  }

  return (
    <Table
      title={messages.topAddresses}
      isLoading={status === Status.Loading}
      className={clsx(styles.topAddressesTable, {
        [className!]: !!className
      })}
      columns={columns}
      data={data}
      limit={limit}
      renderRow={renderRow}
      onRowClick={onRowClick}
      onClickMore={limit ? onClickMore : undefined}
      moreText={limit ? messages.viewMoreAddress : undefined}
      alwaysShowMore={alwaysShowMore}
    />
  )
}

export default TopOperatorsTable
