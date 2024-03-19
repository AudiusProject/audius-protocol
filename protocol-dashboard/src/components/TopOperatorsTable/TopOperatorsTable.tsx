import clsx from 'clsx'
import React, { useCallback } from 'react'
import { NODES_SERVICE_PROVIDERS, accountPage } from 'utils/routes'

import Table from 'components/Table'
import styles from './TopOperatorsTable.module.css'

import BN from 'bn.js'
import DisplayAudio from 'components/DisplayAudio'
import { NodeOperatorInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import { useUsers } from 'store/cache/user/hooks'
import { Address, Operator, SortUser, Status } from 'types'
import getActiveStake, { getTotalActiveDelegatedStake } from 'utils/activeStake'
import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'

const messages = {
  topAddresses: 'Top Node Operators',
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
    pushRoute(NODES_SERVICE_PROVIDERS)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: TableUser) => {
      pushRoute(accountPage(row.wallet))
    },
    [pushRoute]
  )

  const { status, users } = useUsers({
    limit,
    filter: 'isOperator',
    sortBy: SortUser.stakePlusDelegates
  })

  let columns = [{ title: 'Rank', className: styles.rankColumn }]
  if (!isMobile) {
    columns = columns.concat([
      { title: 'Staked + Delegated', className: styles.totalStakedColumn }
    ])
  }

  const data = (users as Operator[])
    .map(user => {
      const activeStake = getActiveStake(user)
      const totalActiveDelegated = getTotalActiveDelegatedStake(user)
      const totalCurrentStake = activeStake.add(totalActiveDelegated)
      return {
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
    .map((user, index) => {
      return {
        rank: index + 1,
        ...user
      }
    })

  const renderRow = (data: TableUser) => {
    return (
      <div className={styles.rowContainer}>
        <div className={clsx(styles.rowCol, styles.colRank)}>{data.rank}</div>
        <UserImage
          className={clsx(styles.rowCol, styles.colImg)}
          wallet={data.wallet}
          alt={'User Profile'}
        />
        <UserName
          className={clsx(styles.rowCol, styles.colAddress)}
          wallet={data.wallet}
        />
        {!isMobile && (
          <>
            <DisplayAudio
              className={clsx(styles.rowCol, styles.totalStakedColumn)}
              amount={data.staked}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <Table
      title={messages.topAddresses}
      tooltipComponent={NodeOperatorInfoTooltip}
      isLoading={!status || status === Status.Loading}
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
