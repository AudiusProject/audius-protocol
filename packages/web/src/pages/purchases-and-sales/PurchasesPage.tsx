import { useCallback, useContext, useState } from 'react'

import {
  FeatureFlags,
  Id,
  Status,
  USDCPurchaseDetails,
  accountSelectors,
  combineStatuses,
  statusIsNotFinalized,
  useAllPaginatedQuery,
  useGetPurchases,
  useGetPurchasesCount,
  useUSDCPurchaseDetailsModal
} from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconCloudDownload
} from '@audius/harmony'
import { full } from '@audius/sdk'
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
import { FEED_PAGE } from 'utils/route'

import styles from './PurchasesPage.module.css'
import {
  PurchasesTable,
  PurchasesTableSortDirection,
  PurchasesTableSortMethod
} from './PurchasesTable'
import { NoTransactionsContent } from './components/NoTransactionsContent'

const { getUserId } = accountSelectors

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
    dispatch(pushRoute(FEED_PAGE))
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

/**
 * Fetches and renders a table of purchases for the currently logged in user
 * */
const RenderPurchasesPage = () => {
  const userId = useSelector(getUserId)
  // Defaults: sort method = date, sort direction = desc
  const [sortMethod, setSortMethod] =
    useState<full.GetPurchasesSortMethodEnum>(DEFAULT_SORT_METHOD)
  const [sortDirection, setSortDirection] =
    useState<full.GetPurchasesSortDirectionEnum>(DEFAULT_SORT_DIRECTION)
  const { mainContentRef } = useContext(MainContentContext)

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
    { force: true }
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
    const { data: encodedDataMessage, signature: encodedDataSignature } =
      await audiusBackendInstance.signDiscoveryNodeRequest()
    const blob = await sdk.users.downloadPurchasesAsCSVBlob({
      id: Id.parse(userId!),
      encodedDataMessage,
      encodedDataSignature
    })
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `audius_purchases_${formatToday()}.csv`
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }, [userId])

  const header = (
    <Header
      primary={messages.headerText}
      rightDecorator={
        <Button
          onClick={downloadCSV}
          variant={ButtonType.SECONDARY}
          size={ButtonSize.SMALL}
          iconLeft={IconCloudDownload}
          disabled={isLoading || isEmpty}
        >
          {messages.downloadCSV}
        </Button>
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
          <NoPurchases />
        ) : (
          <PurchasesTable
            key='purchases'
            data={purchases}
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

export const PurchasesPage = () => {
  const { isLoaded, isEnabled } = useFlag(FeatureFlags.USDC_PURCHASES)

  // Return null if flag isn't loaded yet to prevent flash of 404 page
  if (!isLoaded) return null
  return isEnabled ? <RenderPurchasesPage /> : <NotFoundPage />
}
