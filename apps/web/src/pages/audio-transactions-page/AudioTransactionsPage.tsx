import {
  accountSelectors,
  FeatureFlags,
  TransactionDetails,
  TransactionMetadataType,
  TransactionMethod,
  TransactionType
} from '@audius/common'
import { useSelector } from 'react-redux'

import { AudioTransactionsTable } from 'components/audio-transactions-table'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import EmptyTable from 'components/tracks-table/EmptyTable'
import TracksTable from 'components/tracks-table/TracksTable'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './AudioTransactionsPage.module.css'

const { getUserId } = accountSelectors

const messages = {
  pageTitle: 'AudioTransactions',
  pageDescription: 'View your listening history',
  emptyTableText: 'You don’t have any $AUDIO transactions yet.',
  emptyTableSecondaryText: 'Once you have, this is where you’ll find them!',
  headerText: '$AUDIO Transactions'
}

export type AudioTransactionsPageProps = {}

// Test Data for testing
const data: TransactionDetails[] = [
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.SEND,
    date: '6/23/2020',
    change: '-100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.CHALLENGE_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.COINBASE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.COINBASE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.COINBASE,
    date: '6/23/2020',
    change: '100',
    balance: '100100',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.STRIPE,
    date: '6/23/2020',
    change: '100',
    balance: '100200',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.COINBASE,
    date: '6/23/2020',
    change: '100',
    balance: '100300',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.SEND,
    date: '6/23/2020',
    change: '-100',
    balance: '1000000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TRANSFER,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '55',
    balance: '1000000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TRENDING_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '5',
    balance: '1000000',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '1000000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.STRIPE,
    date: '6/23/2020',
    change: '100',
    balance: '100200',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.SEND,
    date: '6/23/2020',
    change: '-100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TRENDING_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '5',
    balance: '1000000',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.PURCHASE,
    method: TransactionMethod.STRIPE,
    date: '6/23/2020',
    change: '100',
    balance: '100200',
    metadata: {
      discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
      usd: '0',
      sol: '0',
      audio: '0',
      purchaseTransactionId: '0',
      swapTransactionId: '0'
    }
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.SEND,
    date: '6/23/2020',
    change: '-100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TRENDING_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '5',
    balance: '1000000',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.CHALLENGE_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '1',
    balance: '333333333',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.SEND,
    date: '6/23/2020',
    change: '-100',
    balance: '100000',
    metadata: {}
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TRENDING_REWARD,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '5',
    balance: '1000000',
    metadata: undefined
  },
  {
    signature: 'banana_bread',
    transactionType: TransactionType.TIP,
    method: TransactionMethod.RECEIVE,
    date: '6/23/2020',
    change: '100',
    balance: '100000',
    metadata: {}
  }
]

export const AudioTransactionsPage = (props: AudioTransactionsPageProps) => {
  const { isEnabled: isNewTablesEnabled } = useFlag(FeatureFlags.NEW_TABLES)
  const tableLoading = !data.every((transaction: any) =>
    Boolean(transaction.signature)
  )
  const isEmpty = data.length === 0

  const userId = useSelector(getUserId)

  return (
    <Page
      title={messages.pageTitle}
      description={messages.pageDescription}
      header={<Header primary={messages.headerText} />}
    >
      <div className={styles.bodyWrapper}>
        {isEmpty && !tableLoading ? (
          <EmptyTable
            primaryText={messages.emptyTableText}
            secondaryText={messages.emptyTableSecondaryText}
          />
        ) : isNewTablesEnabled ? (
          <AudioTransactionsTable
            key='audioTransactions'
            data={data}
            loading={tableLoading}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <TracksTable
              userId={userId}
              loading={tableLoading}
              loadingRowsCount={data.length}
              dataSource={data}
            />
          </div>
        )}
      </div>
    </Page>
  )
}
