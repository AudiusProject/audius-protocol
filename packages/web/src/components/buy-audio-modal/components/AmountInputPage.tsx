import { useCallback, useMemo } from 'react'

import { StringKeys } from '@audius/common/services'
import {
  buyAudioActions,
  buyAudioSelectors,
  OnRampProvider
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { useRemoteVar } from 'hooks/useRemoteConfig'

import styles from './AmountInputPage.module.css'
import { AudioAmountPicker } from './AudioAmountPicker'
import { CoinbaseBuyAudioButton } from './CoinbaseBuyAudioButton'
import { PurchaseQuote } from './PurchaseQuote'
import { StripeBuyAudioButton } from './StripeBuyAudioButton'

const { calculateAudioPurchaseInfo } = buyAudioActions

const messages = {
  intermediateSolNoticeCoinbase:
    'An intermediate purchase of SOL will be made via Coinbase Pay and then converted to $AUDIO.',
  intermediateSolNoticeStripe:
    'An intermediate purchase of SOL will be made via Link by Stripe and then converted to $AUDIO.'
}

const { getBuyAudioProvider } = buyAudioSelectors

export const AmountInputPage = () => {
  const dispatch = useDispatch()
  const provider = useSelector(getBuyAudioProvider)
  const presetAmountsConfig = useRemoteVar(StringKeys.BUY_AUDIO_PRESET_AMOUNTS)

  const handleAmountChange = useCallback(
    (amount: string) => {
      const audioAmount = parseInt(amount)
      if (!isNaN(audioAmount)) {
        dispatch(
          calculateAudioPurchaseInfo({
            audioAmount
          })
        )
      }
    },
    [dispatch]
  )

  const presetAmounts = useMemo(() => {
    return presetAmountsConfig.split(',').map((amount) => amount.trim())
  }, [presetAmountsConfig])

  return (
    <div className={styles.inputPage}>
      <AudioAmountPicker
        presetAmounts={presetAmounts}
        onAmountChanged={handleAmountChange}
      />
      <PurchaseQuote />
      <div className={styles.buyButtonContainer}>
        {provider === OnRampProvider.COINBASE ? (
          <CoinbaseBuyAudioButton />
        ) : (
          <StripeBuyAudioButton />
        )}
      </div>
      <div className={styles.conversionNotice}>
        {provider === OnRampProvider.COINBASE
          ? messages.intermediateSolNoticeCoinbase
          : messages.intermediateSolNoticeStripe}
      </div>
    </div>
  )
}
