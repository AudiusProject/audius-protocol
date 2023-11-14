import { useContext, useMemo, useState } from 'react'

import { Status, combineStatuses, useUSDCBalance } from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  Flex,
  IconCloudDownload,
  Paper,
  SelectablePill
} from '@audius/harmony'

import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'

import styles from './PayAndEarnPage.module.css'
import { Purchases, usePurchases } from './Purchases'
import { Sales, useSales } from './Sales'
import { Withdrawals, useWithdrawals } from './Withdrawals'
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

  const {
    count: salesCount,
    data: sales,
    fetchMore: fetchMoreSales,
    onSort: onSalesSort,
    onClickRow: onSalesClickRow,
    isEmpty: isSalesEmpty,
    isLoading: isSalesLoading,
    downloadCSV: downloadSalesCSV
  } = useSales()
  const {
    count: purchasesCount,
    data: purchases,
    fetchMore: fetchMorePurchases,
    onSort: onPurchasesSort,
    onClickRow: onPurchasesClickRow,
    isEmpty: isPurchasesEmpty,
    isLoading: isPurchasesLoading,
    downloadCSV: downloadPurchasesCSV
  } = usePurchases()
  const {
    count: withdrawalsCount,
    data: withdrawals,
    fetchMore: fetchMoreWithdrawals,
    onSort: onWithdrawalsSort,
    onClickRow: onWithdrawalsClickRow,
    isEmpty: isWithdrawalsEmpty,
    isLoading: isWithdrawalsLoading,
    downloadCSV: downloadWithdrawalsCSV
  } = useWithdrawals()
  const isDownloadCSVButtonDisabled =
    selectedTable === 'sales'
      ? isSalesLoading || isSalesEmpty
      : selectedTable === 'purchases'
      ? isPurchasesLoading || isPurchasesEmpty
      : isWithdrawalsLoading || isWithdrawalsEmpty

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
          <Paper p='xl' backgroundColor={'black'}>
            <Flex direction='column' gap='xl'>
              <Flex>
                {tables.map((t) => (
                  <SelectablePill
                    key={t.type}
                    label={t.label}
                    isSelected={selectedTable === t.type}
                    onClick={() => setSelectedTable(t.type)}
                  />
                ))}
                <Button
                  onClick={
                    selectedTable === 'withdrawals'
                      ? downloadWithdrawalsCSV
                      : selectedTable === 'purchases'
                      ? downloadPurchasesCSV
                      : downloadSalesCSV
                  }
                  variant={ButtonType.SECONDARY}
                  size={ButtonSize.SMALL}
                  iconLeft={IconCloudDownload}
                  disabled={isDownloadCSVButtonDisabled}
                ></Button>
              </Flex>
              {selectedTable === 'withdrawals' ? (
                <Withdrawals
                  data={withdrawals}
                  count={withdrawalsCount}
                  isEmpty={isWithdrawalsEmpty}
                  isLoading={isWithdrawalsLoading}
                  onSort={onWithdrawalsSort}
                  onClickRow={onWithdrawalsClickRow}
                  fetchMore={fetchMoreWithdrawals}
                />
              ) : selectedTable === 'purchases' ? (
                <Purchases
                  data={purchases}
                  count={purchasesCount}
                  isEmpty={isPurchasesEmpty}
                  isLoading={isPurchasesLoading}
                  onSort={onPurchasesSort}
                  onClickRow={onPurchasesClickRow}
                  fetchMore={fetchMorePurchases}
                />
              ) : (
                <Sales
                  data={sales}
                  count={salesCount}
                  isEmpty={isSalesEmpty}
                  isLoading={isSalesLoading}
                  onSort={onSalesSort}
                  onClickRow={onSalesClickRow}
                  fetchMore={fetchMoreSales}
                />
              )}
            </Flex>
          </Paper>
        </>
      )}
    </Page>
  )
}
