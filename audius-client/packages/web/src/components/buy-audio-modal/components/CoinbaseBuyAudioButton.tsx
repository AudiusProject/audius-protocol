import { useCallback, useContext } from 'react'

import { buyAudioActions, buyAudioSelectors, Status } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import {
  CoinbasePayContext,
  CoinbasePayButtonCustom
} from 'components/coinbase-pay-button'
import { getRootSolanaAccount } from 'services/audius-backend/BuyAudio'

const { onRampOpened, onRampCanceled, onRampSucceeded } = buyAudioActions
const { getAudioPurchaseInfo, getAudioPurchaseInfoStatus } = buyAudioSelectors

export const CoinbaseBuyAudioButton = ({
  amount
}: {
  amount: number | undefined
}) => {
  const dispatch = useDispatch()
  const coinbasePay = useContext(CoinbasePayContext)
  const rootAccount = useAsync(getRootSolanaAccount)
  const purchaseInfoStatus = useSelector(getAudioPurchaseInfoStatus)
  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const isDisabled = purchaseInfoStatus !== Status.SUCCESS

  const handleExit = useCallback(() => {
    dispatch(onRampCanceled())
  }, [dispatch])
  const handleSuccess = useCallback(() => {
    dispatch(onRampSucceeded())
  }, [dispatch])

  const handleClick = useCallback(() => {
    if (
      purchaseInfoStatus === Status.SUCCESS &&
      purchaseInfo?.isError === false
    ) {
      coinbasePay.resetParams({
        destinationWalletAddress: rootAccount.value?.publicKey.toString(),
        presetCryptoAmount: amount,
        onSuccess: handleSuccess,
        onExit: handleExit
      })
      dispatch(onRampOpened(purchaseInfo))
      coinbasePay.open()
    }
  }, [
    coinbasePay,
    dispatch,
    purchaseInfoStatus,
    purchaseInfo,
    rootAccount,
    amount,
    handleSuccess,
    handleExit
  ])

  return (
    <CoinbasePayButtonCustom
      disabled={isDisabled}
      isDisabled={isDisabled}
      onClick={handleClick}
    />
  )
}
