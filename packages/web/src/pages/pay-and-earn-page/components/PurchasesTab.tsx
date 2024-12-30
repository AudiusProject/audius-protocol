import { useCallback, useState } from 'react'

import { useGetPurchases, useGetPurchasesCount, Id } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import {
  Status,
  statusIsNotFinalized,
  combineStatuses,
  USDCPurchaseDetails
} from '@audius/common/models'
import {
  accountSelectors,
  useUSDCPurchaseDetailsModal
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { full } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { useErrorPageOnFailedStatus } from 'hooks/useErrorPageOnFailedStatus'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'
import { audiusSdk } from 'services/audius-sdk'
import { formatToday } from 'utils/dateUtils'
import { push } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

import styles from '../PayAndEarnPage.module.css'

import { NoTransactionsContent } from './NoTransactionsContent'
import {
  PurchasesTable,
  PurchasesTableColumn,
  PurchasesTableSortDirection,
  PurchasesTableSortMethod
} from './PurchasesTable'

const { getUserId } = accountSelectors
const { FEED_PAGE } = route

const messages = {
  pageTitle: 'Purchase History',
  pageDescription: 'View your purchase history',
  noPurchasesHeader: `You haven't bought anything yet.`,
  noPurchasesBody: 'Once you make a purchase, it will show up here.',
  findSongs: 'Find Songs',
  headerText: 'Your Purchases',
  downloadCSV: 'Download CSV'
}

const TRANSACTIONS_BATCH_SIZE = 50

const sortMethods: {
  [k in PurchasesTableSortMethod]: full.GetPurchasesSortMethodEnum
} = {
  contentId: full.GetPurchasesSortMethodEnum.ContentTitle,
  createdAt: full.GetPurchasesSortMethodEnum.Date,
  sellerUserId: full.GetPurchasesSortMethodEnum.ArtistName
}

const sortDirections: {
  [k in PurchasesTableSortDirection]: full.GetPurchasesSortDirectionEnum
} = {
  asc: full.GetPurchasesSortDirectionEnum.Asc,
  desc: full.GetPurchasesSortDirectionEnum.Desc
}

const DEFAULT_SORT_METHOD = full.GetPurchasesSortMethodEnum.Date
const DEFAULT_SORT_DIRECTION = full.GetPurchasesSortDirectionEnum.Desc

const NoPurchases = () => {
  const dispatch = useDispatch()
  const handleClickFindSongs = useCallback(() => {
    dispatch(push(FEED_PAGE))
  }, [dispatch])

  return (
    <NoTransactionsContent
      headerText={messages.noPurchasesHeader}
      bodyText={messages.noPurchasesBody}
      ctaText={messages.findSongs}
      onCTAClicked={handleClickFindSongs}
    />
  )
}

export const usePurchases = () => {
  const userId = useSelector(getUserId)
  // Defaults: sort method = date, sort direction = desc
  const [sortMethod, setSortMethod] =
    useState<full.GetPurchasesSortMethodEnum>(DEFAULT_SORT_METHOD)
  const [sortDirection, setSortDirection] =
    useState<full.GetPurchasesSortDirectionEnum>(DEFAULT_SORT_DIRECTION)

  const { onOpen: openDetailsModal } = useUSDCPurchaseDetailsModal()

  const {
    status: dataStatus,
    data: purchases,
    hasMore,
    loadMore
  } = useAllPaginatedQuery(
    useGetPurchases,
    { userId, sortMethod, sortDirection },
    { disabled: !userId, pageSize: TRANSACTIONS_BATCH_SIZE, force: true }
  )
  const { status: countStatus, data: count } = useGetPurchasesCount(
    {
      userId
    },
    { disabled: !userId, force: true }
  )

  const status = combineStatuses([dataStatus, countStatus])

  // TODO: Should fetch users before rendering the table

  const onSort = useCallback(
    (
      method: PurchasesTableSortMethod,
      direction: PurchasesTableSortDirection
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

  useErrorPageOnFailedStatus({ status })

  const onClickRow = useCallback(
    (purchaseDetails: USDCPurchaseDetails) => {
      openDetailsModal({ variant: 'purchase', purchaseDetails })
    },
    [openDetailsModal]
  )

  const isEmpty =
    status === Status.ERROR ||
    (status === Status.SUCCESS && purchases.length === 0)
  const isLoading = statusIsNotFinalized(status)

  const downloadCSV = useCallback(async () => {
    const sdk = await audiusSdk()
    const blob = await sdk.users.downloadPurchasesAsCSVBlob({
      id: Id.parse(userId!)
    })
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `audius_purchases_${formatToday()}.csv`
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }, [userId])

  return {
    count,
    data: purchases,
    fetchMore,
    onSort,
    onClickRow,
    isEmpty,
    isLoading,
    downloadCSV
  }
}

/**
 * Fetches and renders a table of purchases for the currently logged in user
 * */
export const PurchasesTab = ({
  data,
  count,
  isEmpty,
  isLoading,
  onSort,
  onClickRow,
  fetchMore
}: Omit<ReturnType<typeof usePurchases>, 'downloadCSV'>) => {
  const mainContentRef = useMainContentRef()
  const isMobile = useIsMobile()

  const columns = isMobile
    ? (['contentName', 'date', 'value'] as PurchasesTableColumn[])
    : undefined

  return (
    <div className={styles.container}>
      {isEmpty ? (
        <NoPurchases />
      ) : (
        <PurchasesTable
          key='purchases'
          columns={columns}
          data={data}
          loading={isLoading}
          onSort={onSort}
          onClickRow={onClickRow}
          fetchMore={fetchMore}
          totalRowCount={count}
          scrollRef={mainContentRef}
          fetchBatchSize={TRANSACTIONS_BATCH_SIZE}
          isVirtualized={true}
        />
      )}
    </div>
  )
}
