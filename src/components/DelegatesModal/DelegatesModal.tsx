import React, { useCallback } from 'react'
import clsx from 'clsx'

import { useDelegates } from 'store/cache/user/hooks'
import styles from './DelegatesModal.module.css'
import AudiusClient from 'services/Audius'
import ModalTable from 'components/ModalTable'
import Tooltip from 'components/Tooltip'
import BN from 'bn.js'
import { Delegate, Address } from 'types'
import { formatShortWallet, formatWei } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import { accountPage } from 'utils/routes'

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
}

type OwnProps = {
  wallet: string
  isOpen: boolean
  onClose: () => void
}
type DelegatesModalProps = OwnProps

const DelegatesModal: React.FC<DelegatesModalProps> = ({
  wallet,
  isOpen,
  onClose
}: DelegatesModalProps) => {
  const { delegates } = useDelegates({ wallet })

  const data = (delegates as Delegate[]).map(delegate => {
    return {
      img: delegate.img,
      name: delegate.name,
      address: delegate.wallet,
      amount: delegate.amount
    }
  })

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
          text={formatWei(data.amount)}
        >
          {AudiusClient.displayShortAud(data.amount)}
        </Tooltip>
      </div>
    )
  }

  const pushRoute = usePushRoute()
  const onRowClick = useCallback(
    (row: Delegator) => {
      onClose()
      pushRoute(accountPage(row.address))
    },
    [onClose, pushRoute]
  )

  if (data.length === 0) {
    return null
  }
  const count = data.length
  const modalHeader = `${count} Addresses`

  return (
    <ModalTable
      title={messages.modalTitle}
      header={modalHeader}
      isOpen={isOpen}
      onClose={onClose}
    >
      {data.map(d => (
        <div onClick={() => onRowClick(d)} className={styles.modalRow}>
          {renderRow(d)}
        </div>
      ))}
    </ModalTable>
  )
}

export default DelegatesModal
