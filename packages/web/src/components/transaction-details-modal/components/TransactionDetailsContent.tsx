import { ReactNode } from 'react'

import {
  TransactionDetails,
  TransactionMethod,
  formatNumberString,
  TransactionType
} from '@audius/common'
import cn from 'classnames'

import { ReactComponent as LogoCoinbase } from 'assets/img/LogoCoinbase.svg'
import { ReactComponent as LogoStripe } from 'assets/img/LogoStripe.svg'
import AppIcon from 'assets/img/appIcon.png'
import { ReactComponent as IconCoinbaseMini } from 'assets/img/iconCoinbaseMini.svg'
import { ReactComponent as IconStripeMini } from 'assets/img/iconStripeMini.svg'

import { Block, BlockContainer } from './Block'
import styles from './TransactionDetailsContent.module.css'
import { TransactionPurchaseMetadata } from './TransactionPurchaseMetadata'

const messages = {
  transaction: 'Transaction',
  method: 'Method',
  date: 'Date',
  change: 'Change ($AUDIO)',
  balance: 'Balance ($AUDIO)',
  purchaseDescription: 'Purchased $AUDIO'
}

const AppLogo = () => (
  <img src={AppIcon} alt={'Audius Logo'} width={40} height={40} />
)

// TODO: Make these not partial once other transaction types are in
const transactionDescriptions: Partial<Record<TransactionType, string>> = {
  [TransactionType.PURCHASE]: messages.purchaseDescription
}
const typeIconMap: Partial<Record<TransactionType, ReactNode>> = {
  [TransactionType.PURCHASE]: <AppLogo />
}
const methodIconMap: Partial<Record<TransactionMethod, ReactNode>> = {
  [TransactionMethod.COINBASE]: <IconCoinbaseMini />,
  [TransactionMethod.STRIPE]: <IconStripeMini />
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
        <div className={styles.transactionIcon}>
          <div className={cn(styles.transactionIconMini, styles.coinbase)}>
            {methodIconMap[transactionDetails.method]}
          </div>
          {typeIconMap[transactionDetails.transactionType]}
        </div>
      </div>
      {transactionDetails.metadata ? (
        <TransactionPurchaseMetadata metadata={transactionDetails.metadata} />
      ) : null}

      {transactionDetails.method === TransactionMethod.COINBASE ? (
        <Block className={styles.method} header={messages.method}>
          <LogoCoinbase />
        </Block>
      ) : null}
      {transactionDetails.method === TransactionMethod.STRIPE ? (
        <Block className={styles.method} header={messages.method}>
          <LogoStripe />
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
