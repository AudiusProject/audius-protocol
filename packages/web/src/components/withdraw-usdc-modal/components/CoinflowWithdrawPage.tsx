import { useCallback, useState } from 'react'

import { useCoinflowAdapter, withdrawUSDCActions } from '@audius/common'
import { CoinflowWithdraw } from '@coinflowlabs/react'
import { useField } from 'formik'
import { useDispatch } from 'react-redux'
import { useUnmount } from 'react-use'

import { env } from 'services/env'

import { AMOUNT, WithdrawFormValues } from '../types'

const { coinflowWithdrawalCanceled, coinflowWithdrawalSucceeded } =
  withdrawUSDCActions

const parseTransactionFromSuccessParams = (params: string) => {
  try {
    const parsed = JSON.parse(params)
    return parsed.data as string
  } catch (e) {
    console.error(
      `Failed to parse transaction from params: ${params}, received error: ${e}`
    )
    return ''
  }
}

const MERCHANT_ID = env.COINFLOW_MERCHANT_ID
const IS_PRODUCTION = env.ENVIRONMENT === 'production'

export const CoinflowWithdrawPage = () => {
  const adapter = useCoinflowAdapter()
  const dispatch = useDispatch()
  const [{ value: amountCents }] =
    useField<WithdrawFormValues[typeof AMOUNT]>(AMOUNT)
  const [completed, setCompleted] = useState(false)

  useUnmount(() => {
    // There is no cancelation callback for coinflow, but we want
    // to make sure any waiting saga finishes.
    if (!completed) {
      dispatch(coinflowWithdrawalCanceled())
    }
  })

  const handleSuccess = useCallback(
    (params: string) => {
      const transaction = parseTransactionFromSuccessParams(params)
      setCompleted(true)
      dispatch(coinflowWithdrawalSucceeded({ transaction }))
    },
    [dispatch]
  )

  return adapter ? (
    <CoinflowWithdraw
      amount={amountCents / 100}
      wallet={adapter.wallet}
      connection={adapter.connection}
      onSuccess={handleSuccess}
      merchantId={MERCHANT_ID || ''}
      env={IS_PRODUCTION ? 'prod' : 'sandbox'}
      blockchain='solana'
    />
  ) : null
}
