import { InAppAudioPurchaseMetadata, formatNumberString } from '@audius/common'

import { ReactComponent as IconExternalLink } from 'assets/img/iconExternalLink.svg'
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
  metadata: InAppAudioPurchaseMetadata
}) => {
  return (
    <BlockContainer>
      <Block header={messages.cost}>
        <IconUSD />
        <span className={styles.amount}>
          {formatNumberString(metadata.usd, { minDecimals: 2, maxDecimals: 2 })}
        </span>
        <span className={styles.label}>{messages.usd}</span>
      </Block>
      <Block
        header={
          <a
            className={styles.link}
            href={`https://explorer.solana.com/tx/${metadata.purchaseTransactionId}`}
            target='_blank'
            title={messages.viewOnExplorer}
            rel='noreferrer'
          >
            {messages.purchased} <IconExternalLink />
          </a>
        }
      >
        <IconSOL />

        <span className={styles.amount}>
          {formatNumberString(metadata.sol, { maxDecimals: 2 })}
        </span>
        <span className={styles.label}>{messages.sol}</span>
      </Block>
      <Block
        header={
          <a
            className={styles.link}
            href={`https://explorer.solana.com/tx/${metadata.swapTransactionId}`}
            target='_blank'
            title={messages.viewOnExplorer}
            rel='noreferrer'
          >
            {messages.convertedTo} <IconExternalLink />
          </a>
        }
      >
        <IconAUDIO />
        <span className={styles.amount}>
          {formatNumberString(metadata.audio, { maxDecimals: 2 })}
        </span>
        <span className={styles.label}>{messages.audio}</span>
      </Block>
    </BlockContainer>
  )
}
