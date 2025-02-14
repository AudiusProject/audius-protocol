import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

import { statusIsNotFinalized } from '@audius/common/models'
import {
  audioTransactionsPageActions,
  audioTransactionsPageSelectors,
  TransactionDetails,
  transactionDetailsActions,
  TransactionType
} from '@audius/common/store'
import { Flex, IconCaretRight } from '@audius/harmony'
import { full } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import { AudioTransactionsTable } from 'components/audio-transactions-table'
import EmptyTable from 'components/tracks-table/EmptyTable'
import { useMainContentRef } from 'pages/MainContentContext'
import { useSelector } from 'utils/reducer'

import styles from './AudioWalletTransactions.module.css'
const {
  fetchAudioTransactions,
  fetchAudioTransactionMetadata,
  fetchAudioTransactionsCount
} = audioTransactionsPageActions
const {
  getAudioTransactions,
  getAudioTransactionsStatus,
  getAudioTransactionsCount,
  getAudioTransactionsCountStatus
} = audioTransactionsPageSelectors
const { fetchTransactionDetailsSucceeded } = transactionDetailsActions

const messages = {
  pageTitle: 'Audio Transactions History',
  pageDescription: 'View your transactions history',
  emptyTableText: 'You don’t have any $AUDIO transactions yet.',
  emptyTableSecondaryText: 'Once you have, this is where you’ll find them!',
  headerText: '$AUDIO Transactions',
  disclaimer:
    'Transactions history does not include balances from linked wallets',
  moreInfo: 'More Info'
}

const AUDIO_TRANSACTIONS_BATCH_SIZE = 50

const Disclaimer = () => {
  const setVisibility = useSetVisibility()
  return (
    <Flex className={styles.container} shadow='mid'>
      <span className={styles.disclaimerMessage}>{messages.disclaimer}</span>
      <div
        className={styles.moreInfoContainer}
        onClick={() => setVisibility('AudioBreakdown')(true)}
      >
        <span className={styles.moreInfo}>{messages.moreInfo}</span>
        <IconCaretRight color='subdued' className={styles.iconCaretRight} />
      </div>
    </Flex>
  )
}

export const AudioWalletTransactions = () => {
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(AUDIO_TRANSACTIONS_BATCH_SIZE)
  const [sortMethod, setSortMethod] =
    useState<full.GetAudioTransactionHistorySortMethodEnum>(
      full.GetAudioTransactionHistorySortMethodEnum.Date
    )
  const [sortDirection, setSortDirection] =
    useState<full.GetAudioTransactionHistorySortDirectionEnum>(
      full.GetAudioTransactionHistorySortDirectionEnum.Desc
    )
  const mainContentRef = useMainContentRef()
  const dispatch = useDispatch()
  const setVisibility = useSetVisibility()

  const audioTransactions: (TransactionDetails | {})[] =
    useSelector(getAudioTransactions)
  const audioTransactionsStatus = useSelector(getAudioTransactionsStatus)
  const audioTransactionsCount: number = useSelector(getAudioTransactionsCount)
  const audioTransactionsCountStatus = useSelector(
    getAudioTransactionsCountStatus
  )

  useEffect(() => {
    dispatch(fetchAudioTransactionsCount())
  }, [dispatch])

  useLayoutEffect(() => {
    dispatch(
      fetchAudioTransactions({ offset, limit, sortMethod, sortDirection })
    )
  }, [dispatch, offset, limit, sortMethod, sortDirection])

  // Defaults: sort method = date, sort direction = desc
  const onSort = useCallback(
    (sortMethodInner: string, sortDirectionInner: string) => {
      const sortMethodRes =
        sortMethodInner === 'type'
          ? full.GetAudioTransactionHistorySortMethodEnum.TransactionType
          : full.GetAudioTransactionHistorySortMethodEnum.Date
      setSortMethod(sortMethodRes)
      const sortDirectionRes =
        sortDirectionInner === 'asc'
          ? full.GetAudioTransactionHistorySortDirectionEnum.Asc
          : full.GetAudioTransactionHistorySortDirectionEnum.Desc
      setSortDirection(sortDirectionRes)
      setOffset(0)
    },
    [setSortMethod, setSortDirection]
  )

  const fetchMore = useCallback(
    (offset: number, limit: number) => {
      setOffset(offset)
      setLimit(limit)
    },
    [setOffset, setLimit]
  )

  const onClickRow = useCallback(
    (txDetails: TransactionDetails) => {
      dispatch(
        fetchTransactionDetailsSucceeded({
          transactionId: txDetails.signature,
          transactionDetails: txDetails
        })
      )
      if (txDetails.transactionType === TransactionType.PURCHASE) {
        dispatch(
          fetchAudioTransactionMetadata({
            txDetails
          })
        )
      }
      setVisibility('TransactionDetails')(true)
    },
    [dispatch, setVisibility]
  )

  const tableLoading =
    statusIsNotFinalized(audioTransactionsStatus) ||
    statusIsNotFinalized(audioTransactionsCountStatus)
  const isEmpty = audioTransactions.length === 0

  return (
    <div className={styles.bodyWrapper}>
      <Disclaimer />
      {isEmpty && !tableLoading ? (
        <EmptyTable
          primaryText={messages.emptyTableText}
          secondaryText={messages.emptyTableSecondaryText}
        />
      ) : (
        <AudioTransactionsTable
          key='audioTransactions'
          data={audioTransactions}
          loading={tableLoading}
          onSort={onSort}
          onClickRow={onClickRow}
          fetchMore={fetchMore}
          isVirtualized={false}
          totalRowCount={audioTransactionsCount}
          scrollRef={mainContentRef}
          fetchBatchSize={AUDIO_TRANSACTIONS_BATCH_SIZE}
        />
      )}
    </div>
  )
}
