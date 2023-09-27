import { useCallback, useEffect, useState } from 'react'

import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { Status } from 'models/Status'
import { BNUSDC, StringUSDC } from 'models/Wallet'
import { getUserbankAccountInfo } from 'services/index'
import { useAppContext } from 'src/context/appContext'
import { getUSDCBalance } from 'store/wallet/selectors'
import { setUSDCBalance } from 'store/wallet/slice'
import { getRecoveryStatus } from 'store/buy-usdc/selectors'

/**
 * On mount, fetches the USDC balance for the current user and stores it
 * in the redux wallet slice.
 *
 * Note: a status is returned alongside the balance which may indicate a
 * stale balance. If absolute latest balance value is needed, defer use until
 * Status.SUCCESS.
 */
export const useUSDCBalance = () => {
  const { audiusBackend } = useAppContext()
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
    setBalanceStatus(Status.LOADING)
    try {
      const account = await getUserbankAccountInfo(audiusBackend, {
        mint: 'usdc'
      })
      const balance = (account?.amount ?? new BN(0)) as BNUSDC
      setData(balance)
      setBalanceStatus(Status.SUCCESS)
    } catch (e) {
      setBalanceStatus(Status.ERROR)
    }
  }, [audiusBackend, setData])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { balanceStatus, recoveryStatus, data, refresh }
}
