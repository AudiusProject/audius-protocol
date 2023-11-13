import { useMemo, useState } from 'react'

import { Status, combineStatuses, useUSDCBalance } from '@audius/common'
import { SelectablePill } from '@audius/harmony'

import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'

import styles from './PayAndEarnPage.module.css'
import { Purchases } from './Purchases'
import { Sales } from './Sales'
import { Withdrawals } from './Withdrawals'
import { USDCCard } from './components/USDCCard'

export const messages = {
  title: 'Pay & Earn',
  description: 'Pay & earn with Audius',
  sales: 'Sales',
  purchases: 'Your Purchases',
  withdrawals: 'Withdrawal History'
}

type TableType = 'sales' | 'purchases' | 'withdrawals'
type TableMetadata = { label: string; type: TableType }

export const PayAndEarnPage = () => {
  const [selectedTable, setSelectedTable] = useState<TableType>('sales')
  const statuses = []
  const { data: balance, balanceStatus } = useUSDCBalance({
    isPolling: true,
    pollingInterval: 3000
  })
  if (balance === null) {
    statuses.push(balanceStatus)
  }
  const status = combineStatuses(statuses)

  const header = <Header primary={messages.title} />

  const tables: TableMetadata[] = useMemo(
    () => [
      {
        label: messages.sales,
        type: 'sales'
      },
      {
        label: messages.purchases,
        type: 'purchases'
      },
      {
        label: messages.withdrawals,
        type: 'withdrawals'
      }
    ],
    []
  )

  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      {balance === null || status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <>
          <USDCCard balance={balance} />
          <div className={styles.tableContainer}>
            {tables.map((t) => (
              <SelectablePill
                key={t.type}
                label={t.label}
                isSelected={selectedTable === t.type}
                onClick={() => setSelectedTable(t.type)}
              />
            ))}
            {selectedTable === 'withdrawals' ? (
              <Withdrawals />
            ) : selectedTable === 'purchases' ? (
              <Purchases />
            ) : (
              <Sales />
            )}
          </div>
        </>
      )}
    </Page>
  )
}
