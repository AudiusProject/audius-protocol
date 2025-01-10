import { useCallback, useState } from 'react'

import {
  useAudioTransactions,
  useAudioTransactionsCount
} from '@audius/common/api'
import {
  transactionDetailsActions,
  TransactionDetails
} from '@audius/common/store'
import { IconCaretRight } from '@audius/harmony'
import { full } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import { AudioTransactionsTable } from 'components/audio-transactions-table'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import EmptyTable from 'components/tracks-table/EmptyTable'
import { useMainContentRef } from 'pages/MainContentContext'

import styles from './AudioTransactionsPage.module.css'

const { fetchTransactionDetailsSucceeded } = transactionDetailsActions

const messages = {
  pageTitle: 'Audio Transactions History',
  pageDescription: 'View your transactions history',
  emptyTableText: "You don't have any $AUDIO transactions yet.",
  emptyTableSecondaryText: "Once you have, this is where you'll find them!",
  headerText: '$AUDIO Transactions',
  disclaimer:
    'Transactions history does not include balances from linked wallets',
  moreInfo: 'More Info'
}

const AUDIO_TRANSACTIONS_BATCH_SIZE = 50

const Disclaimer = () => {
  const setVisibility = useSetVisibility()
  return (
    <div className={styles.container}>
      <span className={styles.disclaimerMessage}>{messages.disclaimer}</span>
      <div
        className={styles.moreInfoContainer}
        onClick={() => setVisibility('AudioBreakdown')(true)}
      >
        <span className={styles.moreInfo}>{messages.moreInfo}</span>
        <IconCaretRight color='subdued' className={styles.iconCaretRight} />
      </div>
    </div>
  )
}

export const AudioTransactionsPage = () => {
  const [sortMethod, setSortMethod] =
    useState<full.GetAudioTransactionsSortMethodEnum>(
      full.GetAudioTransactionsSortMethodEnum.Date
    )
  const [sortDirection, setSortDirection] =
    useState<full.GetAudioTransactionsSortDirectionEnum>(
      full.GetAudioTransactionsSortDirectionEnum.Desc
    )
  const mainContentRef = useMainContentRef()
  const dispatch = useDispatch()
  const setVisibility = useSetVisibility()

  const {
    data: audioTransactionsData,
    fetchNextPage,
    isPending: isTransactionsLoading
  } = useAudioTransactions({
    limit: AUDIO_TRANSACTIONS_BATCH_SIZE,
    sortMethod,
    sortDirection
  })

  const audioTransactions = audioTransactionsData ?? []

  const { data: audioTransactionsCount = 0, isPending: isCountLoading } =
    useAudioTransactionsCount()

  // Defaults: sort method = date, sort direction = desc
  const onSort = useCallback(
    (sortMethodInner: string, sortDirectionInner: string) => {
      const sortMethodRes =
        sortMethodInner === 'type'
          ? full.GetAudioTransactionsSortMethodEnum.TransactionType
          : full.GetAudioTransactionsSortMethodEnum.Date
      setSortMethod(sortMethodRes)
      const sortDirectionRes =
        sortDirectionInner === 'asc'
          ? full.GetAudioTransactionsSortDirectionEnum.Asc
          : full.GetAudioTransactionsSortDirectionEnum.Desc
      setSortDirection(sortDirectionRes)
    },
    [setSortMethod, setSortDirection]
  )

  const onClickRow = useCallback(
    (txDetails: TransactionDetails) => {
      dispatch(
        fetchTransactionDetailsSucceeded({
          transactionId: txDetails.signature,
          transactionDetails: txDetails
        })
      )
      setVisibility('TransactionDetails')(true)
    },
    [dispatch, setVisibility]
  )

  const tableLoading = isTransactionsLoading || isCountLoading
  const isEmpty = audioTransactions.length === 0

  return (
    <Page
      title={messages.pageTitle}
      description={messages.pageDescription}
      header={<Header primary={messages.headerText} />}
    >
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
            fetchMore={() => fetchNextPage()}
            isVirtualized={true}
            totalRowCount={audioTransactionsCount}
            scrollRef={mainContentRef}
            fetchBatchSize={AUDIO_TRANSACTIONS_BATCH_SIZE}
          />
        )}
      </div>
    </Page>
  )
}
