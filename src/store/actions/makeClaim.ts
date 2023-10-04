import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { fetchPendingClaim } from '../../store/cache/claims/hooks'
import { Status, Address } from '../../types'
import Audius from '../../services/Audius'
import { AppState } from '../../store/types'
import { fetchUser } from '../../store/cache/user/hooks'

function claimAudiusRewards(
  wallet: Address,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      await aud.Delegate.claimRewards(wallet)
      await dispatch(fetchPendingClaim(wallet))
      await dispatch(fetchUser(wallet))
      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useMakeClaim = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const makeClaim = useCallback(
    (wallet: Address) => {
      if (status !== Status.Loading) {
        dispatch(claimAudiusRewards(wallet, setStatus, setError))
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, makeClaim }
}
