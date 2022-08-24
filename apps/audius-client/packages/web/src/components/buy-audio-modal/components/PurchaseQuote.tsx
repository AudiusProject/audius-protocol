import {
  Status,
  formatNumberCommas,
  PurchaseInfoErrorType,
  buyAudioSelectors
} from '@audius/common'
import { IconCaretDown } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import IconAUDIOSrc from 'assets/img/iconAUDIO.png'
import IconSOLSrc from 'assets/img/iconSOL.png'
import IconUSDSrc from 'assets/img/iconUSD.png'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

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

type FormatOptions = { minDecimals?: number; maxDecimals?: number }
const formatNumber = (number?: string, options?: FormatOptions) => {
  if (!number) {
    return null
  }
  const parts = number.split('.')
  const res =
    parts.length > 1 && parts[1] !== undefined
      ? parts[0] +
        '.' +
        parts[1]
          .substring(0, options?.maxDecimals ?? parts[1].length)
          .padEnd(options?.minDecimals ?? 0, '0')
      : parts[0]
  return formatNumberCommas(res)
}

const Icon = ({ src, alt }: { src: string; alt: string }) => {
  return <img src={src} alt={alt} width={24} height={24} />
}

const IconAUDIO = () => {
  return <Icon src={IconAUDIOSrc} alt={'AUDIO Token Icon'} />
}

const IconSOL = () => {
  return <Icon src={IconSOLSrc} alt={'SOL Token Icon'} />
}

const IconUSD = () => {
  return <Icon src={IconUSDSrc} alt={'USD Logo'} />
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
            {purchaseInfoStatus === Status.LOADING ? (
              <LoadingSpinner className={styles.spinner} />
            ) : null}
          </div>
        ) : (
          <>
            <IconSOL />
            {formatNumber(purchaseInfo?.estimatedSOL.uiAmountString, {
              maxDecimals: 2
            })}
            <span className={styles.tokenLabel}>{messages.sol}</span>
            <IconCaretDown className={styles.caret} />
            <IconAUDIO />
            {formatNumber(purchaseInfo?.desiredAudioAmount.uiAmountString, {
              maxDecimals: 2
            })}
            <span className={styles.tokenLabel}>{messages.audio}</span>
            {purchaseInfoStatus === Status.LOADING ? (
              <LoadingSpinner className={styles.spinner} />
            ) : null}
          </>
        )}
      </div>
      <div className={styles.dollarInfo}>
        <div className={styles.row}>
          <IconUSD />
          <span className={styles.tokenLabel}>{messages.usd}</span>
          {purchaseInfoStatus === Status.LOADING ? (
            <LoadingSpinner className={styles.spinner} />
          ) : null}
        </div>
        <div className={styles.dollarEstimate}>
          <span className={styles.tokenLabel}>$</span>
          {formatNumber(
            !purchaseInfo?.isError
              ? purchaseInfo?.estimatedUSD.uiAmountString ?? '0'
              : '0',
            {
              minDecimals: 2,
              maxDecimals: 2
            }
          )}
        </div>
      </div>
    </>
  )
}
