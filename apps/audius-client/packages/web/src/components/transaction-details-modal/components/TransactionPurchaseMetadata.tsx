import { InAppAudioPurchaseMetadata, formatNumberString } from '@audius/common'
import { IconButton } from '@audius/stems'

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
  viewOnExplorer: 'View on Solana Explorer'
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
        {formatNumberString(metadata.usd, { minDecimals: 2, maxDecimals: 2 })}
      </Block>
      <Block
        header={
          <>
            {messages.purchased}
            <IconButton
              className={styles.iconButton}
              icon={<IconExternalLink />}
              title={messages.viewOnExplorer}
              aria-label={messages.viewOnExplorer}
              href={`https://explorer.solana.com/tx/${metadata.purchaseTransactionId}`}
              target='_blank'
            />
          </>
        }
      >
        <IconSOL />
        {formatNumberString(metadata.sol, { maxDecimals: 2 })}
      </Block>
      <Block
        header={
          <>
            {messages.convertedTo}
            <IconButton
              className={styles.iconButton}
              icon={<IconExternalLink />}
              title={messages.viewOnExplorer}
              aria-label={messages.viewOnExplorer}
              href={`https://explorer.solana.com/tx/${metadata.swapTransactionId}`}
              target='_blank'
            />
          </>
        }
      >
        <IconAUDIO />
        {formatNumberString(metadata.audio, { maxDecimals: 2 })}
      </Block>
    </BlockContainer>
  )
}
