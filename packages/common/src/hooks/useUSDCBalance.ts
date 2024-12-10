import { useCallback, useEffect, useState } from 'react'

import { Commitment } from '@solana/web3.js'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { useGetCurrentUser } from '~/api'
import { useAppContext } from '~/context/appContext'
import { Status } from '~/models/Status'
import { BNUSDC, StringUSDC } from '~/models/Wallet'
import { getUserbankAccountInfo } from '~/services/index'
import { getRecoveryStatus } from '~/store/buy-usdc/selectors'
import { getUSDCBalance } from '~/store/wallet/selectors'
import { setUSDCBalance } from '~/store/wallet/slice'

import { useInterval } from './useInterval'

/**
 * On mount, fetches the USDC balance for the current user and stores it
 * in the redux wallet slice.
 *
 * Note: a status is returned alongside the balance which may indicate a
 * stale balance. If absolute latest balance value is needed, defer use until
 * Status.SUCCESS.
 */
export const useUSDCBalance = ({
  isPolling,
  pollingInterval = 1000,
  commitment = 'processed'
}: {
  isPolling?: boolean
  pollingInterval?: number
  commitment?: Commitment
} = {}) => {
  const { audiusSdk: sdk } = useAppContext()
  const { data: user } = useGetCurrentUser({})
  const ethAddress = user?.wallet ?? null
  const dispatch = useDispatch()

  const [balanceStatus, setBalanceStatus] = useState(Status.IDLE)
  const recoveryStatus = useSelector(getRecoveryStatus)
  const data = useSelector(getUSDCBalance)
  const setData = useCallback(
    (balance: BNUSDC) => {
      dispatch(setUSDCBalance({ amount: balance.toString() as StringUSDC }))
    },
    [dispatch]
  )

  const refresh = useCallback(async () => {
    if (!ethAddress) {
      return
    }
    setBalanceStatus(Status.LOADING)
    try {
      const account = await getUserbankAccountInfo(
        sdk,
        {
          mint: 'USDC'
        },
        commitment
      )
      const balance = (account?.amount ?? new BN(0)) as BNUSDC
      setData(balance)
      setBalanceStatus(Status.SUCCESS)
    } catch (e) {
      setBalanceStatus(Status.ERROR)
    }
  }, [ethAddress, sdk, setData, commitment])

  // Refresh balance on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  const id = useInterval(() => {
    if (isPolling) {
      refresh()
    }
  }, pollingInterval)

  const cancelPolling = useCallback(() => {
    clearInterval(id)
  }, [id])

  // If we haven't loaded the balance yet for the first time or we're
  // actively recovering, then we will be in loading state.
  const status =
    balanceStatus === Status.IDLE ||
    (balanceStatus === Status.LOADING && data === null) ||
    recoveryStatus === Status.LOADING
      ? Status.LOADING
      : balanceStatus
  return { status, data, refresh, cancelPolling }
}
