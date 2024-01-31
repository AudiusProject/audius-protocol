import { InAppAudioPurchaseMetadata } from '@audius/common/store'
import {} from '@audius/common'
import {
  formatNumberString,
  makeSolanaTransactionLink,
  Nullable
} from '@audius/common/utils'

import IconExternalLink from 'assets/img/iconExternalLink.svg'
import {
  IconUSD,
  IconSOL,
  IconAUDIO
} from 'components/buy-audio-modal/components/Icons'

import { BlockContainer, Block } from './Block'
import styles from './TransactionPurchaseMetadata.module.css'

const messages = {
  cost: 'Cost',
  purchased: 'Purchased',
  convertedTo: 'Converted To',
  viewOnExplorer: 'View on Solana Explorer',
  usd: 'USD',
  sol: 'SOL',
  audio: '$AUDIO'
}

export const TransactionPurchaseMetadata = ({
  metadata
}: {
  metadata?: Nullable<InAppAudioPurchaseMetadata>
}) => {
  return (
    <BlockContainer>
      <Block header={messages.cost}>
        <IconUSD />
        <span className={styles.amount}>
          {metadata?.usd
            ? formatNumberString(metadata.usd, {
                minDecimals: 2,
                maxDecimals: 2
              })
            : '?'}
        </span>
        <span className={styles.label}>{messages.usd}</span>
      </Block>
      <Block
        header={
          metadata?.purchaseTransactionId ? (
            <a
              className={styles.link}
              href={makeSolanaTransactionLink(metadata.purchaseTransactionId)}
              target='_blank'
              title={messages.viewOnExplorer}
              rel='noreferrer'
            >
              {messages.purchased} <IconExternalLink />
            </a>
          ) : (
            messages.purchased
          )
        }
      >
        <IconSOL />
        <span className={styles.amount}>
          {metadata?.sol
            ? formatNumberString(metadata.sol, { maxDecimals: 2 })
            : '?'}
        </span>
        <span className={styles.label}>{messages.sol}</span>
      </Block>
      <Block
        header={
          metadata?.swapTransactionId ? (
            <a
              className={styles.link}
              href={makeSolanaTransactionLink(metadata.swapTransactionId)}
              target='_blank'
              title={messages.viewOnExplorer}
              rel='noreferrer'
            >
              {messages.convertedTo} <IconExternalLink />
            </a>
          ) : (
            messages.convertedTo
          )
        }
      >
        <IconAUDIO />
        <span className={styles.amount}>
          {metadata?.audio
            ? formatNumberString(metadata.audio, { maxDecimals: 2 })
            : '?'}
        </span>
        <span className={styles.label}>{messages.audio}</span>
      </Block>
    </BlockContainer>
  )
}
