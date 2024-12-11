import { useCallback } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { Status } from '@audius/common/models'
import {
  buyAudioActions,
  buyAudioSelectors,
  OnRampProvider
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { OnRampButton } from 'components/on-ramp-button'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './CoinbaseBuyAudioButton.module.css'
import { useCoinbasePay } from './useCoinbasePay'

const {
  onrampOpened,
  onrampCanceled,
  onrampSucceeded,
  calculateAudioPurchaseInfo
} = buyAudioActions
const { getAudioPurchaseInfo, getAudioPurchaseInfoStatus } = buyAudioSelectors

const messages = {
  belowSolThreshold: 'Coinbase requires a purchase minimum of 0.05 SOL'
}

export const CoinbaseBuyAudioButton = () => {
  const dispatch = useDispatch()
  const { solanaWalletService } = useAudiusQueryContext()
  const coinbasePay = useCoinbasePay()
  const purchaseInfoStatus = useSelector(getAudioPurchaseInfoStatus)
  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const amount =
    purchaseInfo?.isError === false
      ? purchaseInfo.estimatedSOL.uiAmount
      : undefined

  const belowSolThreshold = amount !== undefined && amount < 0.05
  const isDisabled = purchaseInfoStatus === Status.LOADING || belowSolThreshold

  const handleExit = useCallback(() => {
    dispatch(onrampCanceled())
  }, [dispatch])

  const handleSuccess = useCallback(() => {
    dispatch(onrampSucceeded())
  }, [dispatch])

  const handleClick = useCallback(() => {
    if (
      purchaseInfoStatus === Status.SUCCESS &&
      purchaseInfo?.isError === false
    ) {
      const rootAccount = solanaWalletService.getKeypair()
      if (!rootAccount) {
        console.error('CoinbaseBuyAudioButton: Missing solana root account')
        return
      }

      coinbasePay.resetParams({
        destinationWalletAddress: rootAccount.publicKey.toString(),
        presetCryptoAmount: amount,
        onSuccess: handleSuccess,
        onExit: handleExit
      })
      dispatch(onrampOpened(purchaseInfo))
      coinbasePay.open()
    } else if (purchaseInfoStatus === Status.IDLE) {
      // Generally only possible if `amount` is still undefined,
      // in which case we want to trigger the min audio exceeded error
      dispatch(calculateAudioPurchaseInfo({ audioAmount: amount ?? 0 }))
    }
  }, [
    coinbasePay,
    dispatch,
    purchaseInfoStatus,
    purchaseInfo,
    solanaWalletService,
    amount,
    handleSuccess,
    handleExit
  ])

  return (
    <Tooltip
      className={styles.tooltip}
      text={messages.belowSolThreshold}
      disabled={!belowSolThreshold}
      color='secondary'
      shouldWrapContent={false}
    >
      <OnRampButton
        provider={OnRampProvider.COINBASE}
        disabled={isDisabled}
        onClick={handleClick}
      />
    </Tooltip>
  )
}
