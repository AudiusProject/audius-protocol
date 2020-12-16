import React, { useCallback } from 'react'
import clsx from 'clsx'
import Audius from 'services/Audius'
import { SERVICES_SERVICE_PROVIDERS, accountPage } from 'utils/routes'

import styles from './TopAddressesTable.module.css'
import Table from 'components/Table'
import Tooltip from 'components/Tooltip'
import { formatShortWallet, formatWeight, formatWei } from 'utils/format'

import { useServiceProviders } from 'store/cache/user/hooks'
import { useTotalStaked } from 'store/cache/protocol/hooks'
import { Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'
import getActiveStake from 'utils/activeStake'

const messages = {
  topAddresses: 'Top Addresses by Voting Weight',
  viewMoreAddress: 'View Leaderboard'
}

type TableUser = {
  rank: number
  img: string
  name: string
  wallet: string
  staked: number
  voteWeight: number
  proposedVotes: number
}

type OwnProps = {
  className?: string
  limit?: number
  alwaysShowMore?: boolean
}

type TopAddressesTableProps = OwnProps

const TopAddressesTable: React.FC<TopAddressesTableProps> = ({
  className,
  limit,
  alwaysShowMore
}: TopAddressesTableProps) => {
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

  const { status, users } = useServiceProviders({ limit })
  const totalStaked = useTotalStaked()

  let columns = [{ title: 'Rank', className: styles.rankColumn }]
  if (!isMobile) {
    columns = columns.concat([
      { title: 'Staked', className: styles.totalStakedColumn },
      { title: 'Vote Weight', className: styles.voteWeightColumn },
      { title: 'Proposals Voted', className: styles.proposalVotedColumn }
    ])
  }

  const data = users
    .map((user, idx) => {
      const activeStake = getActiveStake(user)

      const voteWeight = Audius.getBNPercentage(activeStake, totalStaked)
      return {
        rank: idx + 1,
        img: user.image,
        name: user.name,
        wallet: user.wallet,
        staked: activeStake,
        voteWeight,
        proposedVotes: user.voteHistory.length
      }
    })
    .sort((a, b) => b.voteWeight - a.voteWeight)

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
            <div className={clsx(styles.rowCol, styles.voteWeightColumn)}>
              {`${formatWeight(data.voteWeight)}%`}
            </div>
            <div className={clsx(styles.rowCol, styles.proposalVotedColumn)}>
              {data.proposedVotes}
            </div>
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

export default TopAddressesTable
