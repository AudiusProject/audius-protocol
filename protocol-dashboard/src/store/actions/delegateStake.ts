import { useState, useCallback, useEffect } from 'react'

import { AnyAction } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { Action } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import Audius from 'services/Audius'
import { getAccountWallet } from 'store/account/hooks'
import { fetchUser } from 'store/cache/user/hooks'
import { AppState } from 'store/types'
import { Status, BigNumber, Address } from 'types'

export function delegateAudiusStake(
  serviceOperatorWallet: Address,
  stakingAmount: BigNumber,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      await aud.Delegate.delegateStake(serviceOperatorWallet, stakingAmount)
      await dispatch(fetchUser(serviceOperatorWallet))

      const state = getState()
      const wallet = getAccountWallet(state)
      if (wallet) await dispatch(fetchUser(wallet))

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useDelegateStake = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const delegateStake = useCallback(
    (serviceOperatorWallet: Address, stakingAmount: BigNumber) => {
      if (status !== Status.Loading) {
        dispatch(
          delegateAudiusStake(
            serviceOperatorWallet,
            stakingAmount,
            setStatus,
            setError
          )
        )
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, delegateStake }
}
