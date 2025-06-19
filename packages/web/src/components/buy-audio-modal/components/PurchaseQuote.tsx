import { Status } from '@audius/common/models'
import { buyAudioSelectors, PurchaseInfoErrorType } from '@audius/common/store'
import { IconCaretDown } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { IconAUDIO, IconSOL, IconUSD } from './Icons'
import styles from './PurchaseQuote.module.css'

const messages = {
  sol: 'SOL',
  audio: '$AUDIO',
  usd: 'EST. (USD)',
  belowMinimumError: (minimum: number) =>
    `Minimum Purchase of ${minimum} $AUDIO is Required to continue`,
  aboveMaximumError: (maximum: number) =>
    `Value Exceeds Purchase Limit of ${maximum} $AUDIO`,
  unknownError: 'Something went wrong'
}

export const PurchaseQuote = () => {
  const purchaseInfo = useSelector(buyAudioSelectors.getAudioPurchaseInfo)
  const purchaseInfoStatus = useSelector(
    buyAudioSelectors.getAudioPurchaseInfoStatus
  )
  let errorMessage: string | null = null
  if (purchaseInfo?.isError) {
    if (purchaseInfo.errorType === PurchaseInfoErrorType.MAX_AUDIO_EXCEEDED) {
      errorMessage = messages.aboveMaximumError(purchaseInfo.maxAudio)
    } else if (
      purchaseInfo.errorType === PurchaseInfoErrorType.MIN_AUDIO_EXCEEDED
    ) {
      errorMessage = messages.belowMinimumError(purchaseInfo.minAudio)
    } else {
      errorMessage = messages.unknownError
    }
  }
  return (
    <>
      <div className={cn(styles.exchangeInfo, styles.row)}>
        {purchaseInfo?.isError ? (
          <div className={styles.error}>
            <span>{errorMessage}</span>
          </div>
        ) : (
          <>
            <IconSOL />
            {Number(
              purchaseInfo?.estimatedSOL.uiAmountString || 0
            ).toLocaleString(undefined, {
              maximumFractionDigits: 3
            })}
            <span className={styles.tokenLabel}>{messages.sol}</span>
            <IconCaretDown className={styles.caret} />
            <IconAUDIO />
            {Number(
              purchaseInfo?.desiredAudioAmount.uiAmountString || 0
            ).toLocaleString(undefined, {
              maximumFractionDigits: 2
            })}
            <span className={styles.tokenLabel}>{messages.audio}</span>
          </>
        )}
      </div>
      <div className={styles.dollarInfo}>
        <div className={styles.row}>
          <IconUSD />
          <span className={styles.tokenLabel}>{messages.usd}</span>
        </div>
        <div className={styles.dollarEstimate}>
          {purchaseInfoStatus === Status.LOADING ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <>
              <span className={styles.tokenLabel}>$</span>
              {Number(
                !purchaseInfo?.isError
                  ? (purchaseInfo?.estimatedUSD.uiAmountString ?? '0')
                  : '0'
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </>
          )}
        </div>
      </div>
    </>
  )
}
