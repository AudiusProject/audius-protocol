import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Address, Status } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { useEffect } from 'react'

import { fetchClaim, setClaim } from 'store/cache/claims/slice'

// -------------------------------- Selectors  --------------------------------
export const getPendingClaim = (wallet: Address) => (state: AppState) =>
  state.cache.claims.users[wallet]

// -------------------------------- Thunk Actions  --------------------------------

export function fetchPendingClaim(
  wallet: Address
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    await aud.awaitSetup()
    dispatch(fetchClaim({ wallet }))
    try {
      const hasClaim = await aud.Claim.claimPending(wallet)
      dispatch(setClaim({ wallet, hasClaim }))
    } catch (error) {
      // TODO: Handle error case
      console.log(error)
    }
  }
}

// -------------------------------- Hooks  --------------------------------

export const usePendingClaim = (wallet: Address) => {
  const pendingClaim = useSelector(getPendingClaim(wallet))
  const dispatch = useDispatch()
  useEffect(() => {
    if (wallet && !pendingClaim) {
      dispatch(fetchPendingClaim(wallet))
    }
  }, [dispatch, wallet, pendingClaim])
  if (!pendingClaim) return { status: Status.Loading, hasClaim: false }
  return pendingClaim
}
