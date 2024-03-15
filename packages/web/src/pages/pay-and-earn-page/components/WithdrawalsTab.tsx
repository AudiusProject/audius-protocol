import { useCallback, useContext, useEffect, useState } from 'react'

import {
  Id,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount,
  userApiFetch,
  userApiUtils
} from '@audius/common/api'
import {
  useAllPaginatedQuery,
  useAudiusQueryContext
} from '@audius/common/audius-query'
import { useUSDCBalance } from '@audius/common/hooks'
import {
  BNUSDC,
  Name,
  Status,
  USDCTransactionDetails,
  combineStatuses,
  statusIsNotFinalized
} from '@audius/common/models'
import {
  WithdrawUSDCModalPages,
  accountSelectors,
  useUSDCTransactionDetailsModal,
  useWithdrawUSDCModal,
  withdrawUSDCSelectors
} from '@audius/common/store'
import { formatUSDCWeiToFloorCentsNumber, wait } from '@audius/common/utils'
import { full } from '@audius/sdk'
import BN from 'bn.js'
import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'

import { useErrorPageOnFailedStatus } from 'hooks/useErrorPageOnFailedStatus'
import { useIsMobile } from 'hooks/useIsMobile'
import { MainContentContext } from 'pages/MainContentContext'
import { make, track } from 'services/analytics'
import { audiusSdk } from 'services/audius-sdk'
import { formatToday } from 'utils/dateUtils'
import { useSelector } from 'utils/reducer'

import styles from '../PayAndEarnPage.module.css'

import { NoTransactionsContent } from './NoTransactionsContent'
import {
  WithdrawalsTable,
  WithdrawalsTableColumn,
  WithdrawalsTableSortDirection,
  WithdrawalsTableSortMethod
} from './WithdrawalsTable'

const { getUserId } = accountSelectors

const messages = {
  pageTitle: 'Withdrawal History',
  pageDescription: 'View your withdrawal history',
  noWithdrawalsHeader: `You haven't made any withdrawals yet.`,
  noWithdrawalsBody: 'Once you complete a withdrawal, it will show up here.',
  noWithdrawalsCTA: 'Withdraw Funds',
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
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { data: balance } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )

  const handleWithdraw = () => {
    openWithdrawUSDCModal({
      page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
    })
    track(
      make({
        eventName: Name.WITHDRAW_USDC_MODAL_OPENED,
        currentBalance: balanceCents / 100
      })
    )
  }

  return (
    <NoTransactionsContent
      headerText={messages.noWithdrawalsHeader}
      bodyText={messages.noWithdrawalsBody}
      ctaText={messages.noWithdrawalsCTA}
      onCTAClicked={handleWithdraw}
    />
  )
}

const useWithdrawalTransactionPoller = () => {
  const audiusQueryContext = useAudiusQueryContext()
  const [isPolling, setIsPolling] = useState(false)

  const beginPolling = useCallback(
    async ({
      userId,
      signature,
      onSuccess
    }: {
      userId: number
      signature: string
      onSuccess: () => void
    }) => {
      setIsPolling(true)

      const pollForTransaction = async () => {
        let timedOut = false
        const timerId = setTimeout(() => {
          timedOut = true
        }, 60000)

        let foundTransaction = false
        let aborted = false
        while (!aborted && !foundTransaction) {
          // We don't yet have a single transaction fetch API, so grab the latest 5 and check
          // for the desired signature in the response. Since this utility is meant to be used
          // for the most recently completed transaction, this is a relatively safe strategy
          const transactions: USDCTransactionDetails[] =
            await userApiFetch.getUSDCTransactions(
              {
                userId,
                sortMethod: full.GetUSDCTransactionsSortMethodEnum.Date,
                sortDirection: full.GetUSDCTransactionsSortDirectionEnum.Desc,
                method: full.GetUSDCTransactionsMethodEnum.Send,
                offset: 0,
                limit: 5
              },
              audiusQueryContext
            )
          if (transactions.some((t) => t.signature === signature)) {
            foundTransaction = true
          } else if (timedOut) {
            aborted = true
          }
          await wait(1000)
        }
        if (timedOut) {
          throw new Error('Timed Out')
        }
        clearTimeout(timerId)
      }

      try {
        await pollForTransaction()
        onSuccess()
        setIsPolling(false)
      } catch (e) {
        console.error(`Failed to poll for transaction: ${signature}: ${e}`)
        setIsPolling(false)
      }
    },
    [audiusQueryContext]
  )

  return { isPolling, beginPolling }
}

export const useWithdrawals = () => {
  const userId = useSelector(getUserId)
  // Type override required because we're dispatching thunk actions below
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>()
  const lastCompletedTransaction = useSelector(
    withdrawUSDCSelectors.getLastCompletedTransactionSignature
  )
  const { isPolling, beginPolling } = useWithdrawalTransactionPoller()
  // Defaults: sort method = date, sort direction = desc
  const [sortMethod, setSortMethod] =
    useState<full.GetUSDCTransactionsSortMethodEnum>(DEFAULT_SORT_METHOD)
  const [sortDirection, setSortDirection] =
    useState<full.GetUSDCTransactionsSortDirectionEnum>(DEFAULT_SORT_DIRECTION)

  const { onOpen: openDetailsModal } = useUSDCTransactionDetailsModal()

  const {
    status: dataStatus,
    data: transactions,
    hasMore,
    loadMore,
    reset
  } = useAllPaginatedQuery(
    useGetUSDCTransactions,
    {
      userId,
      sortMethod,
      sortDirection,
      method: full.GetUSDCTransactionsMethodEnum.Send
    },
    { disabled: !userId, pageSize: TRANSACTIONS_BATCH_SIZE, force: true }
  )
  const { status: countStatus, data: count } = useGetUSDCTransactionsCount(
    {
      userId,
      method: full.GetUSDCTransactionsMethodEnum.Send
    },
    { disabled: !userId, force: true }
  )

  const status = combineStatuses([dataStatus, countStatus])
  useErrorPageOnFailedStatus({ status })

  useEffect(() => {
    if (lastCompletedTransaction && userId) {
      // Wait for new transaction and re-sort table to show newest first
      beginPolling({
        userId,
        signature: lastCompletedTransaction,
        onSuccess: () => {
          setSortMethod(full.GetUSDCTransactionsSortMethodEnum.Date)
          setSortDirection(full.GetUSDCTransactionsSortDirectionEnum.Desc)
          dispatch(userApiUtils.reset('getUSDCTransactions'))
          dispatch(userApiUtils.reset('getUSDCTransactionsCount'))
          reset()
        }
      })
    }
  }, [lastCompletedTransaction, userId, beginPolling, reset, dispatch])

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
  const isLoading = isPolling || statusIsNotFinalized(status)

  const downloadCSV = useCallback(async () => {
    const sdk = await audiusSdk()
    const blob = await sdk.users.downloadUSDCWithdrawalsAsCSVBlob({
      id: Id.parse(userId!)
    })
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `audius_withdrawals_${formatToday()}.csv`
    a.click()
    window.URL.revokeObjectURL(blobUrl)
  }, [userId])

  return {
    count,
    data: transactions,
    fetchMore,
    onSort,
    onClickRow,
    isEmpty,
    isLoading,
    downloadCSV
  }
}

/**
 * Fetches and renders a table of withdrawals for the currently logged in user
 * */
export const WithdrawalsTab = ({
  count,
  data: transactions,
  fetchMore,
  onSort,
  onClickRow,
  isEmpty,
  isLoading
}: Omit<ReturnType<typeof useWithdrawals>, 'downloadCSV'>) => {
  const isMobile = useIsMobile()
  const { mainContentRef } = useContext(MainContentContext)

  const columns = isMobile
    ? (['date', 'amount'] as WithdrawalsTableColumn[])
    : undefined

  return (
    <div className={styles.container}>
      {isEmpty ? (
        <NoWithdrawals />
      ) : (
        <WithdrawalsTable
          key='withdrawals'
          columns={columns}
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
  )
}
