import { useCallback, useEffect, useState } from 'react'

import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { Status } from 'models/Status'
import { BNUSDC, StringUSDC } from 'models/Wallet'
import { getUserbankAccountInfo } from 'services/index'
import { useAppContext } from 'src/context/appContext'
import { getUSDCBalance } from 'store/wallet/selectors'
import { setUSDCBalance } from 'store/wallet/slice'

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

  const [status, setStatus] = useState(Status.IDLE)
  const data = useSelector(getUSDCBalance)
  const setData = useCallback(
    (balance: BNUSDC) => {
      dispatch(setUSDCBalance({ amount: balance.toString() as StringUSDC }))
    },
    [dispatch]
  )

  const refresh = useCallback(async () => {
    if (status === Status.LOADING) return
    setStatus(Status.LOADING)
    try {
      const account = await getUserbankAccountInfo(audiusBackend, {
        mint: 'usdc'
      })
      const balance = (account?.amount ?? new BN(0)) as BNUSDC
      setData(balance)
      setStatus(Status.SUCCESS)
    } catch (e) {
      setStatus(Status.ERROR)
    }
  }, [status, audiusBackend, setData])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { status, data, refresh }
}
