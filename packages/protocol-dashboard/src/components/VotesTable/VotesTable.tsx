import React, { useState } from 'react'
import clsx from 'clsx'
import BN from 'bn.js'

import styles from './VotesTable.module.css'
import Table from 'components/Table'
import { VoteEvent, Address } from 'types'
import { formatAud, formatShortWallet, formatWei } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import { accountPage } from 'utils/routes'
import { useUser } from 'store/cache/user/hooks'
import Modal from 'components/Modal'
import Tooltip from 'components/Tooltip'

const User = ({ wallet }: { wallet: Address }) => {
  const { user } = useUser({ wallet })

  return (
    <div className={styles.user}>
      <div className={styles.image}>
        {user?.image && <img src={user.image} alt="User" />}
      </div>
      {formatShortWallet(wallet)}
    </div>
  )
}

const RenderRow = ({ data }: { data: VoteEvent }) => {
  const pushRoute = usePushRoute()
  return (
    <div
      className={styles.rowContainer}
      onClick={() => pushRoute(accountPage(data.voter))}
    >
      <div className={clsx(styles.rowCol, styles.colAddresses)}>
        {data && <User wallet={data.voter} />}
      </div>
      <Tooltip
        text={data ? formatWei(data.voterStake) : ''}
        className={clsx(styles.rowCol, styles.colVoteWeight)}
      >
        {data && formatAud(data.voterStake)}
      </Tooltip>
    </div>
  )
}

const messages = {
  more: 'View All'
}

type OwnProps = {
  title: string
  votes: VoteEvent[]
  className?: string
}

type VotesTableProps = OwnProps

const VotesTable: React.FC<VotesTableProps> = ({ title, votes, className }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = [
    { title: `${votes?.length} Addresses`, className: styles.colAddresses },
    { title: 'Vote Weight', className: styles.colVoteWeight }
  ]

  const totalStake = votes?.reduce(
    (acc, v) => acc.add(v.voterStake),
    new BN('0')
  )

  return (
    <>
      <Table
        isLoading={!votes}
        title={title}
        className={clsx(styles.mainTable, { [className!]: !!className })}
        columns={columns}
        data={votes || []}
        limit={10}
        renderRow={(data: VoteEvent) => <RenderRow data={data} />}
        alwaysShowMore
        // Click handled by row component
        onClickMore={() => setIsModalOpen(true)}
        moreText={messages.more}
      />
      <Modal
        title={`Votes ${title}`}
        titleRightElement={formatAud(totalStake)}
        className={styles.modal}
        wrapperClassName={styles.modalWrapper}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isCloseable={true}
        dismissOnClickOutside
      >
        <Table
          className={clsx(styles.modalTable, { [className!]: !!className })}
          columns={columns}
          data={votes}
          renderRow={(data: VoteEvent) => <RenderRow data={data} />}
        />
      </Modal>
    </>
  )
}

export default VotesTable
