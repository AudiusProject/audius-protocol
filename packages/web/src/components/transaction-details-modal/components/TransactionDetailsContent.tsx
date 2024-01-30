import {
  cacheUsersSelectors,
  TransactionDetails,
  TransactionMethod,
  formatAudio,
  TransactionType,
  formatCapitalizeString,
  makeSolanaTransactionLink,
  isNullOrUndefined
} from '@audius/common'
import { ChallengeRewardID, User } from '@audius/common/models'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useSelector, useDispatch } from 'react-redux'

import LogoStripeLink from 'assets/img/LogoStripeLink.svg'
import LogoCoinbase from 'assets/img/coinbase-pay/LogoCoinbase.svg'
import IconExternalLink from 'assets/img/iconExternalLink.svg'
import { useSetVisibility } from 'common/hooks/useModalState'
import { AudioTransactionIcon } from 'components/audio-transaction-icon'
import { isChangePositive } from 'components/audio-transactions-table/AudioTransactionsTable'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import UserBadges from 'components/user-badges/UserBadges'
import { getChallengeConfig } from 'pages/audio-rewards-page/config'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import { Block, BlockContainer } from './Block'
import styles from './TransactionDetailsContent.module.css'
import { TransactionPurchaseMetadata } from './TransactionPurchaseMetadata'
const { getUsers } = cacheUsersSelectors

const messages = {
  transaction: 'Transaction',
  method: 'Method',
  date: 'Date',
  dateEarned: 'Date Earned',
  dateTransaction: 'Transaction Date',
  change: 'Change ($AUDIO)',
  balance: 'Balance ($AUDIO)',
  purchaseDescription: 'Purchased $AUDIO',
  trendingRewardDescription: 'Trending Competition Award',
  challengeRewardHeader: 'Challenge Completed',
  challengeRewardDescription: '$AUDIO Reward Earned',
  transferDescription: '$AUDIO ',
  transferSentHeader: 'Destination Wallet',
  transferReceivedHeader: 'Origin Wallet',
  tipDescription: 'Tip ',
  tipSentHeader: 'To User',
  tipReceivedHeader: 'From User',
  unknown: 'Unknown'
}

const transactionDescriptions: Record<TransactionType, string> = {
  [TransactionType.PURCHASE]: messages.purchaseDescription,
  [TransactionType.TIP]: messages.tipDescription,
  [TransactionType.TRANSFER]: messages.transferDescription,
  [TransactionType.TRENDING_REWARD]: messages.trendingRewardDescription,
  [TransactionType.CHALLENGE_REWARD]: messages.challengeRewardDescription
}

type UserDetailsProps = {
  userId: number
}

const UserDetails = ({ userId }: UserDetailsProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const usersMap = useSelector<AppState, { [id: number]: User }>((state) =>
    getUsers(state, { ids: [userId] })
  )
  const isLoading = Object.keys(usersMap).length === 0
  return (
    <>
      {isLoading ? (
        <LoadingSpinner className={styles.spinnerSmall} />
      ) : (
        <div
          className={styles.name}
          onClick={() => {
            setVisibility('TransactionDetails')(false)
            dispatch(pushRoute(profilePage(usersMap[userId].handle)))
          }}
        >
          <span>{usersMap[userId].name}</span>
          <UserBadges
            userId={userId}
            className={styles.badge}
            badgeSize={14}
            inline
          />
        </div>
      )}
    </>
  )
}

const dateAndMetadataBlocks = (transactionDetails: TransactionDetails) => {
  switch (transactionDetails.transactionType) {
    case TransactionType.PURCHASE: {
      return (
        <>
          <TransactionPurchaseMetadata metadata={transactionDetails.metadata} />
          <Block header={messages.date}>{transactionDetails.date}</Block>
        </>
      )
    }
    case TransactionType.CHALLENGE_REWARD: {
      const challengeId = transactionDetails.metadata as ChallengeRewardID
      const challengeConfig = getChallengeConfig(challengeId)
      return (
        <>
          <Block
            className={styles.header}
            header={messages.challengeRewardHeader}
          >
            <div className={styles.challengeIcon}>{challengeConfig.icon}</div>
            {challengeConfig.title}
          </Block>
          <Block header={messages.dateEarned}>{transactionDetails.date}</Block>
        </>
      )
    }
    case TransactionType.TRENDING_REWARD: {
      return (
        <>
          <Block header={messages.dateEarned}>{transactionDetails.date}</Block>
        </>
      )
    }
    case TransactionType.TIP: {
      return (
        <>
          <Block header={messages.dateTransaction}>
            {transactionDetails.date}
          </Block>
          <Block
            className={styles.header}
            header={
              transactionDetails.method === TransactionMethod.SEND
                ? messages.tipSentHeader
                : messages.tipReceivedHeader
            }
          >
            <UserDetails userId={Number(transactionDetails.metadata)} />
          </Block>
        </>
      )
    }
    case TransactionType.TRANSFER: {
      return (
        <>
          <Block header={messages.dateTransaction}>
            {transactionDetails.date}
          </Block>
          <Block
            header={
              <a
                className={styles.link}
                href={makeSolanaTransactionLink(transactionDetails.metadata)}
                target='_blank'
                title={transactionDetails.metadata}
                rel='noreferrer'
              >
                {transactionDetails.method === TransactionMethod.SEND
                  ? messages.transferSentHeader
                  : messages.transferReceivedHeader}
                <IconExternalLink />
              </a>
            }
          >
            {transactionDetails.metadata}
          </Block>
        </>
      )
    }
    default:
      return <></>
  }
}

export const TransactionDetailsContent = ({
  transactionDetails
}: {
  transactionDetails: TransactionDetails
}) => {
  const isLoading =
    transactionDetails.transactionType === TransactionType.PURCHASE
      ? transactionDetails.metadata === undefined
      : false
  const isNegative = !isChangePositive(transactionDetails)
  return (
    <>
      {isLoading ? (
        <div className={styles.spinnerContainer}>
          <LoadingSpinner className={styles.spinner} />
        </div>
      ) : (
        <BlockContainer>
          <div className={styles.flexHorizontal}>
            <Block header={messages.transaction}>
              {transactionDescriptions[transactionDetails.transactionType] +
                ([TransactionType.TIP, TransactionType.TRANSFER].includes(
                  transactionDetails.transactionType
                )
                  ? formatCapitalizeString(transactionDetails.method)
                  : '')}
            </Block>
            <AudioTransactionIcon
              type={transactionDetails.transactionType}
              method={transactionDetails.method}
            />
          </div>
          {dateAndMetadataBlocks(transactionDetails)}

          {transactionDetails.transactionType === TransactionType.PURCHASE ? (
            <Block className={styles.header} header={messages.method}>
              {transactionDetails.method === TransactionMethod.COINBASE ? (
                <LogoCoinbase
                  className={styles.coinbaseLogo}
                  width={155}
                  height={20}
                />
              ) : transactionDetails.method === TransactionMethod.STRIPE ? (
                <LogoStripeLink
                  width={145}
                  height={32}
                  className={styles.stripeLogo}
                />
              ) : (
                messages.unknown
              )}
            </Block>
          ) : null}

          <Block header={messages.change}>
            <span
              className={cn(styles.change, { [styles.negative]: isNegative })}
            >
              {isNegative ? '-' : '+'}
              {formatAudio(transactionDetails.change)}
            </span>
          </Block>
          {/* If user's balance is still loading or failed to load, don't show it. */}
          {isNullOrUndefined(transactionDetails.balance) ? null : (
            <Block header={messages.balance}>
              {formatAudio(transactionDetails.balance, 2)}
            </Block>
          )}
        </BlockContainer>
      )}
    </>
  )
}
