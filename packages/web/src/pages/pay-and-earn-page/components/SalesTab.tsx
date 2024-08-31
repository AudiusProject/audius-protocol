import { useCallback, useState } from 'react'

import { useGetSales, useGetSalesCount, Id } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import { useFeatureFlag } from '@audius/common/hooks'
import {
  Status,
  statusIsNotFinalized,
  combineStatuses,
  USDCPurchaseDetails
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  useUSDCPurchaseDetailsModal
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Flex, IconMoneyBracket, Text, useTheme } from '@audius/harmony'
import { full } from '@audius/sdk'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import FeatureFlag from 'components/feature-flag/FeatureFlag'
import { ExternalTextLink } from 'components/link'
import { useErrorPageOnFailedStatus } from 'hooks/useErrorPageOnFailedStatus'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'
import { audiusSdk } from 'services/audius-sdk'
import { formatToday } from 'utils/dateUtils'
import { useSelector } from 'utils/reducer'

import styles from '../PayAndEarnPage.module.css'

import { NoTransactionsContent } from './NoTransactionsContent'
import {
  SalesTable,
  SalesTableColumn,
  SalesTableSortDirection,
  SalesTableSortMethod
} from './SalesTable'

const { UPLOAD_PAGE } = route
const { getUserId } = accountSelectors

const messages = {
  pageTitle: 'Sales History',
  pageDescription: 'View your sales history',
  noSalesHeader: `You haven't sold anything yet.`,
  noSalesBody: 'Once you make a sale, it will show up here.',
  upload: 'Upload Track',
  headerText: 'Your Sales',
  downloadCSV: 'Download CSV',
  networkSplitExplainer:
    'You will instantly receive 90% of the retail price for every transaction.',
  learnMore: 'Learn more.'
}

const TRANSACTIONS_BATCH_SIZE = 50

const sortMethods: {
  [k in SalesTableSortMethod]: full.GetSalesSortMethodEnum
} = {
  contentId: full.GetSalesSortMethodEnum.ContentTitle,
  createdAt: full.GetSalesSortMethodEnum.Date,
  buyerUserId: full.GetSalesSortMethodEnum.BuyerName
}

const sortDirections: {
  [k in SalesTableSortDirection]: full.GetSalesSortDirectionEnum
} = {
  asc: full.GetSalesSortDirectionEnum.Asc,
  desc: full.GetSalesSortDirectionEnum.Desc
}

const DEFAULT_SORT_METHOD = full.GetSalesSortMethodEnum.Date
const DEFAULT_SORT_DIRECTION = full.GetSalesSortDirectionEnum.Desc

const NoSales = () => {
  const dispatch = useDispatch()
  const handleClickUpload = useCallback(() => {
    dispatch(pushRoute(UPLOAD_PAGE))
  }, [dispatch])
  return (
    <NoTransactionsContent
      headerText={messages.noSalesHeader}
      bodyText={messages.noSalesBody}
      ctaText={messages.upload}
      onCTAClicked={handleClickUpload}
    />
  )
}

export const useSales = () => {
  const userId = useSelector(getUserId)
  // Defaults: sort method = date, sort direction = desc
  const [sortMethod, setSortMethod] =
    useState<full.GetSalesSortMethodEnum>(DEFAULT_SORT_METHOD)
  const [sortDirection, setSortDirection] =
    useState<full.GetSalesSortDirectionEnum>(DEFAULT_SORT_DIRECTION)

  const { onOpen: openDetailsModal } = useUSDCPurchaseDetailsModal()

  const {
    status: dataStatus,
    data: sales,
    hasMore,
    loadMore
  } = useAllPaginatedQuery(
    useGetSales,
    { userId, sortMethod, sortDirection },
    { disabled: !userId, pageSize: TRANSACTIONS_BATCH_SIZE, force: true }
  )

  const { status: countStatus, data: count } = useGetSalesCount(
    { userId },
    { disabled: !userId, force: true }
  )

  const status = combineStatuses([dataStatus, countStatus])

  useErrorPageOnFailedStatus({ status })

  // TODO: Should fetch users before rendering the table

  const onSort = useCallback(
    (method: SalesTableSortMethod, direction: SalesTableSortDirection) => {
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
    (purchaseDetails: USDCPurchaseDetails) => {
      openDetailsModal({ variant: 'sale', purchaseDetails })
    },
    [openDetailsModal]
  )

  const isEmpty = status === Status.SUCCESS && sales.length === 0
  const isLoading = statusIsNotFinalized(status)

  const downloadCSV = useCallback(async () => {
    const sdk = await audiusSdk()
    const blob = await sdk.users.downloadSalesAsCSVBlob({
      id: Id.parse(userId!)
    })
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `audius_sales_${formatToday()}.csv`
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }, [userId])

  return {
    count,
    data: sales,
    fetchMore,
    onSort,
    onClickRow,
    isEmpty,
    isLoading,
    downloadCSV
  }
}
/**
 * Fetches and renders a table of Sales for the currently logged in user
 * */
export const SalesTab = ({
  count,
  data: sales,
  fetchMore,
  onSort,
  onClickRow,
  isEmpty,
  isLoading
}: Omit<ReturnType<typeof useSales>, 'downloadCSV'>) => {
  const isMobile = useIsMobile()
  const mainContentRef = useMainContentRef()
  const { color } = useTheme()
  const { isEnabled: isNetworkCutEnabled } = useFeatureFlag(
    FeatureFlags.NETWORK_CUT_ENABLED
  )

  const columns = isMobile
    ? (['contentName', 'date', 'value'] as SalesTableColumn[])
    : undefined

  return (
    <div className={styles.container}>
      {isNetworkCutEnabled ? (
        <Flex gap='s' ph='l' pt='xl' alignItems='center'>
          <IconMoneyBracket width={16} height={16} fill={color.neutral.n800} />
          <Text variant='body' size='s' textAlign='left'>
            {messages.networkSplitExplainer + ' '}
            <ExternalTextLink to='' variant='visible'>
              <Text variant='body' size='s' textAlign='left'>
                {messages.learnMore}
              </Text>
            </ExternalTextLink>
          </Text>
        </Flex>
      ) : null}
      {isEmpty ? (
        <NoSales />
      ) : (
        <SalesTable
          key='sales'
          columns={columns}
          data={sales}
          loading={isLoading}
          onSort={onSort}
          onClickRow={onClickRow}
          fetchMore={fetchMore}
          totalRowCount={count}
          isVirtualized={true}
          scrollRef={mainContentRef}
          fetchBatchSize={TRANSACTIONS_BATCH_SIZE}
        />
      )}
    </div>
  )
}
