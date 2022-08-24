import { useCallback } from 'react'

import { buyAudioActions, buyAudioSelectors } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import styles from './AmountInputPage.module.css'
import { AudioAmountPicker } from './AudioAmountPicker'
import { CoinbaseBuyAudioButton } from './CoinbaseBuyAudioButton'
import { PurchaseQuote } from './PurchaseQuote'

const { calculateAudioPurchaseInfo } = buyAudioActions
const { getAudioPurchaseInfo } = buyAudioSelectors

const messages = {
  intermediateSolNoticeCoinbase:
    'An intermediate purchase of SOL will be made via Coinbase Pay and then converted to $AUDIO.'
}
export const AmountInputPage = () => {
  const dispatch = useDispatch()
  const purchaseInfo = useSelector(getAudioPurchaseInfo)

  const handleAmountChange = useCallback(
    (amount) => {
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

  return (
    <div className={styles.inputPage}>
      <AudioAmountPicker
        presetAmounts={['5', '10', '25', '50', '100']}
        onAmountChanged={handleAmountChange}
      />
      <PurchaseQuote />
      <div className={styles.buyButtonContainer}>
        <CoinbaseBuyAudioButton
          amount={
            purchaseInfo?.isError === false
              ? purchaseInfo.estimatedSOL.uiAmount
              : undefined
          }
        />
      </div>
      <div className={styles.conversionNotice}>
        {messages.intermediateSolNoticeCoinbase}
      </div>
    </div>
  )
}
