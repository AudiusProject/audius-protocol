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
      await aud.Identity.updateMinimumDelegationAmount(amount)

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
