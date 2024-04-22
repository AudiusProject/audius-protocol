import React, { useCallback } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'

import DisplayAudio from 'components/DisplayAudio'
import ModalTable from 'components/ModalTable'
import UserImage from 'components/UserImage'
import UserName from 'components/UserName'
import { useDelegates } from 'store/cache/user/hooks'
import { Delegate, Address } from 'types'
import { usePushRoute } from 'utils/effects'
import { accountPage } from 'utils/routes'

import styles from './DelegatesModal.module.css'

const messages = {
  title: 'Delegates',
  viewMore: 'View All Delegates',
  modalTitle: 'Delegates'
}

type Delegator = {
  img?: string
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

  const data = (delegates as Delegate[]).map((delegate) => {
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
      {data.map((d) => (
        <div
          key={d.address}
          onClick={() => onRowClick(d)}
          className={styles.modalRow}
        >
          {renderRow(d)}
        </div>
      ))}
    </ModalTable>
  )
}

export default DelegatesModal
