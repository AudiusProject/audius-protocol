import React, { useCallback } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import DisplayAudio from 'components/DisplayAudio'
import { TopContributorsInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import Table from 'components/Table'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import Audius from 'services/Audius'
import { useUsers } from 'store/cache/user/hooks'
import { Address, SortUser, Status } from 'types'
import getActiveStake from 'utils/activeStake'
import { usePushRoute } from 'utils/effects'
import { formatWeight } from 'utils/format'
import { useIsMobile } from 'utils/hooks'
import { NODES_USERS, accountPage } from 'utils/routes'

import styles from './TopAddressesTable.module.css'

const messages = {
  topAddresses: 'Top Contributors',
  viewMoreAddress: 'View Leaderboard'
}

type TableUser = {
  rank: number
  img?: string
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

type TopAddressesTableProps = OwnProps

const TopAddressesTable: React.FC<TopAddressesTableProps> = ({
  className,
  limit,
  alwaysShowMore
}: TopAddressesTableProps) => {
  const isMobile = useIsMobile()
  const pushRoute = usePushRoute()
  const onClickMore = useCallback(() => {
    pushRoute(NODES_USERS)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: TableUser) => {
      pushRoute(accountPage(row.wallet))
    },
    [pushRoute]
  )

  const { status, users } = useUsers({ sortBy: SortUser.activeStake })
  let columns = [{ title: 'Rank', className: styles.rankColumn }]
  if (!isMobile) {
    columns = columns.concat([
      { title: 'Total Staked', className: styles.totalStakedColumn },
      { title: 'Vote Weight', className: styles.voteWeightColumn },
      { title: 'Proposals Voted', className: styles.proposalVotedColumn }
    ])
  }
  const totalVotingPowerStake = users.reduce((total, user) => {
    const activeStake = getActiveStake(user)
    return total.add(activeStake)
  }, new BN('0'))

  let data: TableUser[] = users
    .map((user) => {
      const activeStake = getActiveStake(user)
      const voteWeight = Audius.getBNPercentage(
        activeStake,
        totalVotingPowerStake
      )
      return {
        img: user.image,
        name: user.name,
        wallet: user.wallet,
        staked: activeStake,
        voteWeight,
        proposedVotes: user.voteHistory.length
      }
    })
    .sort((a, b) => b.voteWeight - a.voteWeight)
    .map((user, index) => ({
      rank: index + 1,
      ...user
    }))

  if (limit) {
    data = data.slice(0, limit)
  }

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
      tooltipComponent={TopContributorsInfoTooltip}
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
