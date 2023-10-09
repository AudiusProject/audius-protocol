import { useCallback, useContext, useState } from 'react'

import {
  FeatureFlags,
  Id,
  Status,
  USDCTransactionDetails,
  accountSelectors,
  combineStatuses,
  statusIsNotFinalized,
  useAllPaginatedQuery,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount,
  useUSDCTransactionDetailsModal
} from '@audius/common'
import { full } from '@audius/sdk'
import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconDownload
} from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { useErrorPageOnFailedStatus } from 'hooks/useErrorPageOnFailedStatus'
import { useFlag } from 'hooks/useRemoteConfig'
import { MainContentContext } from 'pages/MainContentContext'
import NotFoundPage from 'pages/not-found-page/NotFoundPage'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk'
import { formatToday } from 'utils/dateUtils'
import { useSelector } from 'utils/reducer'
import { DASHBOARD_PAGE } from 'utils/route'

import styles from './WithdrawalsPage.module.css'
import {
  WithdrawalsTable,
  WithdrawalsTableSortDirection,
  WithdrawalsTableSortMethod
} from './WithdrawalsTable'
import { NoTransactionsContent } from './components/NoTransactionsContent'

const { getUserId } = accountSelectors

const messages = {
  pageTitle: 'Withdrawal History',
  pageDescription: 'View your withdrawal history',
  noWithdrawalsHeader: `You haven't made any withdrawals yet.`,
  noWithdrawalsBody: 'Once you complete a withdrawal, it will show up here.',
  backToDashboard: 'Back To Your Dashboard',
  headerText: 'Withdrawal History',
  downloadCSV: 'Download CSV'
}

const TRANSACTIONS_BATCH_SIZE = 50

const sortMethods: {
  [k in WithdrawalsTableSortMethod]: full.GetUSDCTransactionsSortMethodEnum
} = {
  date: full.GetUSDCTransactionsSortMethodEnum.Date
}

const sortDirections: {
  [k in WithdrawalsTableSortDirection]: full.GetUSDCTransactionsSortDirectionEnum
} = {
  asc: full.GetUSDCTransactionsSortDirectionEnum.Asc,
  desc: full.GetUSDCTransactionsSortDirectionEnum.Desc
}

const DEFAULT_SORT_METHOD = full.GetUSDCTransactionsSortMethodEnum.Date
const DEFAULT_SORT_DIRECTION = full.GetUSDCTransactionsSortDirectionEnum.Desc

const NoWithdrawals = () => {
  const dispatch = useDispatch()
  const handleClickBackToDashboard = useCallback(() => {
    dispatch(pushRoute(DASHBOARD_PAGE))
  }, [dispatch])

  return (
    <NoTransactionsContent
      headerText={messages.noWithdrawalsHeader}
      bodyText={messages.noWithdrawalsBody}
      ctaText={messages.backToDashboard}
      onCTAClicked={handleClickBackToDashboard}
    />
  )
}

/**
 * Fetches and renders a table of withdrawals for the currently logged in user
 * */
const RenderWithdrawalsPage = () => {
  const userId = useSelector(getUserId)
  // Defaults: sort method = date, sort direction = desc
  const [sortMethod, setSortMethod] =
    useState<full.GetUSDCTransactionsSortMethodEnum>(DEFAULT_SORT_METHOD)
  const [sortDirection, setSortDirection] =
    useState<full.GetUSDCTransactionsSortDirectionEnum>(DEFAULT_SORT_DIRECTION)
  const { mainContentRef } = useContext(MainContentContext)

  const { onOpen: openDetailsModal } = useUSDCTransactionDetailsModal()

  const {
    status: dataStatus,
    data: transactions,
    hasMore,
    loadMore
  } = useAllPaginatedQuery(
    useGetUSDCTransactions,
    {
      userId,
      sortMethod,
      sortDirection,
      type: full.GetUSDCTransactionsTypeEnum.Transfer,
      method: full.GetUSDCTransactionsMethodEnum.Send
    },
    { disabled: !userId, pageSize: TRANSACTIONS_BATCH_SIZE, force: true }
  )
  const { status: countStatus, data: count } = useGetUSDCTransactionsCount(
    {
      userId,
      type: full.GetUSDCTransactionsTypeEnum.Transfer,
      method: full.GetUSDCTransactionsMethodEnum.Send
    },
    { force: true }
  )

  const status = combineStatuses([dataStatus, countStatus])
  useErrorPageOnFailedStatus({ status })

  const onSort = useCallback(
    (
      method: WithdrawalsTableSortMethod,
      direction: WithdrawalsTableSortDirection
    ) => {
      setSortMethod(sortMethods[method] ?? DEFAULT_SORT_METHOD)
      setSortDirection(sortDirections[direction] ?? DEFAULT_SORT_DIRECTION)
    },
    []
  )

  const fetchMore = useCallback(() => {
    if (hasMore) {
      loadMore()
    }
  }, [hasMore, loadMore])

  const onClickRow = useCallback(
    (transactionDetails: USDCTransactionDetails) => {
      openDetailsModal({ transactionDetails })
    },
    [openDetailsModal]
  )

  const isEmpty = status === Status.SUCCESS && transactions.length === 0
  const isLoading = statusIsNotFinalized(status)

  const downloadCSV = useCallback(async () => {
    const sdk = await audiusSdk()
    const { data: encodedDataMessage, signature: encodedDataSignature } =
      await audiusBackendInstance.signDiscoveryNodeRequest()
    const blob = await sdk.users.downloadUSDCWithdrawalsAsCSVBlob({
      id: Id.parse(userId!),
      encodedDataMessage,
      encodedDataSignature
    })
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `audius_withdrawals_${formatToday()}.csv`
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }, [userId])

  const header = (
    <Header
      primary={messages.headerText}
      rightDecorator={
        <HarmonyButton
          onClick={downloadCSV}
          text={messages.downloadCSV}
          variant={HarmonyButtonType.SECONDARY}
          size={HarmonyButtonSize.SMALL}
          iconLeft={IconDownload}
          disabled={isLoading || isEmpty}
        />
      }
    />
  )

  return (
    <Page
      title={messages.pageTitle}
      description={messages.pageDescription}
      header={header}
    >
      <div className={styles.container}>
        {isEmpty ? (
          <NoWithdrawals />
        ) : (
          <WithdrawalsTable
            key='withdrawals'
            data={transactions}
            loading={isLoading}
            onSort={onSort}
            onClickRow={onClickRow}
            fetchMore={fetchMore}
            isVirtualized={true}
            scrollRef={mainContentRef}
            totalRowCount={count}
            fetchBatchSize={TRANSACTIONS_BATCH_SIZE}
          />
        )}
      </div>
    </Page>
  )
}

export const WithdrawalsPage = () => {
  const { isLoaded, isEnabled } = useFlag(FeatureFlags.USDC_PURCHASES)

  // Return null if flag isn't loaded yet to prevent flash of 404 page
  if (!isLoaded) return null
  return isEnabled ? <RenderWithdrawalsPage /> : <NotFoundPage />
}
