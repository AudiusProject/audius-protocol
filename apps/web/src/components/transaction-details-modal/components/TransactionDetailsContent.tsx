import {
  TransactionDetails,
  TransactionMethod,
  formatNumberString,
  TransactionType
} from '@audius/common'
import cn from 'classnames'

import { ReactComponent as LogoCoinbase } from 'assets/img/LogoCoinbase.svg'
import { ReactComponent as LogoStripe } from 'assets/img/LogoStripe.svg'
import { AudioTransactionIcon } from 'components/audio-transaction-icon'

import { Block, BlockContainer } from './Block'
import styles from './TransactionDetailsContent.module.css'
import { TransactionPurchaseMetadata } from './TransactionPurchaseMetadata'

const messages = {
  transaction: 'Transaction',
  method: 'Method',
  date: 'Date',
  change: 'Change ($AUDIO)',
  balance: 'Balance ($AUDIO)',
  purchaseDescription: 'Purchased $AUDIO',
  unknown: 'Unknown'
}

// TODO: Make these not partial once other transaction types are in
const transactionDescriptions: Partial<Record<TransactionType, string>> = {
  [TransactionType.PURCHASE]: messages.purchaseDescription
}

export const TransactionDetailsContent = ({
  transactionDetails
}: {
  transactionDetails: TransactionDetails
}) => {
  const isNegative = transactionDetails.change.substring(0, 1) === '-'
  return (
    <BlockContainer>
      <div className={styles.flexHorizontal}>
        <Block header={messages.transaction}>
          {transactionDescriptions[transactionDetails.transactionType]}
        </Block>
        <AudioTransactionIcon
          type={transactionDetails.transactionType}
          method={transactionDetails.method}
        />
      </div>
      {transactionDetails.transactionType === TransactionType.PURCHASE ? (
        <TransactionPurchaseMetadata metadata={transactionDetails.metadata} />
      ) : null}

      {transactionDetails.transactionType === TransactionType.PURCHASE ? (
        <Block className={styles.method} header={messages.method}>
          {transactionDetails.method === TransactionMethod.COINBASE ? (
            <LogoCoinbase />
          ) : transactionDetails.method === TransactionMethod.STRIPE ? (
            <LogoStripe />
          ) : (
            messages.unknown
          )}
        </Block>
      ) : null}

      <Block header={messages.date}>{transactionDetails.date}</Block>
      <Block header={messages.change}>
        <span className={cn(styles.change, { [styles.negative]: isNegative })}>
          {!isNegative ? '+' : ''}
          {formatNumberString(transactionDetails.change, { maxDecimals: 2 })}
        </span>
      </Block>
      <Block header={messages.balance}>
        {formatNumberString(transactionDetails.balance, { maxDecimals: 2 })}
      </Block>
    </BlockContainer>
  )
}
