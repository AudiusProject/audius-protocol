import { useMemo, useState } from 'react'

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
import { PurchasesTab, usePurchases } from './PurchasesTab'
import { SalesTab, useSales } from './SalesTab'
import { WithdrawalsTab, useWithdrawals } from './WithdrawalsTab'
import { USDCCard } from './components/USDCCard'

export const messages = {
  title: 'Pay & Earn',
  description: 'Pay & earn with Audius',
  sales: 'Sales',
  purchases: 'Your Purchases',
  withdrawals: 'Withdrawal History',
  downloadCSV: 'Download CSV'
}

enum TableType {
  SALES = 'sales',
  PURCHASES = 'purchases',
  WITHDRAWALS = 'withdrawals'
}

type TableMetadata = {
  label: string
  downloadCSV: () => void
  isDownloadCSVButtonDisabled: boolean
}

export const PayAndEarnPage = () => {
  const [selectedTable, setSelectedTable] = useState<TableType>(TableType.SALES)
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

  const header = <Header primary={messages.title} />

  const tables: Record<TableType, TableMetadata> = {
    [TableType.SALES]: {
      label: messages.sales,
      downloadCSV: downloadSalesCSV,
      isDownloadCSVButtonDisabled: isSalesLoading || isSalesEmpty
    },
    [TableType.PURCHASES]: {
      label: messages.purchases,
      downloadCSV: downloadPurchasesCSV,
      isDownloadCSVButtonDisabled: isPurchasesLoading || isPurchasesEmpty
    },
    [TableType.WITHDRAWALS]: {
      label: messages.withdrawals,
      downloadCSV: downloadWithdrawalsCSV,
      isDownloadCSVButtonDisabled: isWithdrawalsLoading || isWithdrawalsEmpty
    }
  }

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
          <Paper w='100%'>
            <Flex direction='column' w='100%'>
              <Flex
                ph='xl'
                pt='xl'
                direction='row'
                justifyContent='space-between'
                w='100%'
              >
                <Flex gap='s'>
                  {Object.values(TableType).map((t) => (
                    <SelectablePill
                      key={tables[t].label}
                      label={tables[t].label}
                      isSelected={selectedTable === t}
                      onClick={() => setSelectedTable(t)}
                    />
                  ))}
                </Flex>
                <Button
                  onClick={tables[selectedTable].downloadCSV}
                  variant={ButtonType.SECONDARY}
                  size={ButtonSize.SMALL}
                  iconLeft={IconCloudDownload}
                  disabled={tables[selectedTable].isDownloadCSVButtonDisabled}
                >
                  {messages.downloadCSV}
                </Button>
              </Flex>
              {selectedTable === 'withdrawals' ? (
                <WithdrawalsTab
                  data={withdrawals}
                  count={withdrawalsCount}
                  isEmpty={isWithdrawalsEmpty}
                  isLoading={isWithdrawalsLoading}
                  onSort={onWithdrawalsSort}
                  onClickRow={onWithdrawalsClickRow}
                  fetchMore={fetchMoreWithdrawals}
                />
              ) : selectedTable === 'purchases' ? (
                <PurchasesTab
                  data={purchases}
                  count={purchasesCount}
                  isEmpty={isPurchasesEmpty}
                  isLoading={isPurchasesLoading}
                  onSort={onPurchasesSort}
                  onClickRow={onPurchasesClickRow}
                  fetchMore={fetchMorePurchases}
                />
              ) : (
                <SalesTab
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
