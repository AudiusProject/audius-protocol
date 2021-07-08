import BN from 'bn.js'
import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { getAccountWallet } from 'store/account/hooks'
import { fetchUser } from 'store/cache/user/hooks'

import { Status } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'

const MIN_LOADING_SPINNER_MS = 1000 /* ms */

function updateMinimumDelegationAmount(
  amount: BN,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const state = getState()
      const wallet = getAccountWallet(state)
      if (!wallet) {
        throw new Error(
          'No account wallet present, unable to update service provider minimum delegation amount'
        )
      }

      // Set the min delegation amount for the user
      const updateDelegation = aud.Identity.updateMinimumDelegationAmount(
        amount
      )
      const timeoutPromise = new Promise(resolve =>
        setTimeout(resolve, MIN_LOADING_SPINNER_MS)
      )

      // Wait a minimum of the loading spinner time
      await Promise.all([timeoutPromise, updateDelegation])

      // Re-fetch user to refresh
      await dispatch(fetchUser(wallet))

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useUpdateMinimumDelegationAmount = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const updateMinimum = useCallback(
    (amount: BN) => {
      if (status !== Status.Loading) {
        dispatch(updateMinimumDelegationAmount(amount, setStatus, setError))
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, updateMinimum }
}
