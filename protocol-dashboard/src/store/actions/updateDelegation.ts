import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import AppState from 'store/types'
import Audius from 'services/Audius'
import { AnyAction } from '@reduxjs/toolkit'

import { Address, Status, BigNumber } from 'types'
import { undelegateAudiusStake } from 'store/actions/undelegateStake'
import { delegateAudiusStake } from 'store/actions/delegateStake'

export const useUpdateDelegation = (
  isIncrease: boolean,
  shouldReset?: boolean
) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const updateDelegation = useCallback(
    (wallet: Address, amount: BigNumber) => {
      if (status !== Status.Loading) {
        if (isIncrease) {
          dispatch(delegateAudiusStake(wallet, amount, setStatus, setError))
        } else {
          dispatch(undelegateAudiusStake(wallet, amount, setStatus, setError))
        }
      }
    },
    [isIncrease, dispatch, status, setStatus, setError]
  )
  return { status, error, updateDelegation }
}

export default useUpdateDelegation
