import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { PendingTransactionName, Status, Address } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { fetchPendingTransactions } from 'store/account/hooks'

function cancelDecreaseStake(
  setStatus: (status: Status) => void,
  setError: (error: string) => void
): ThunkAction<void, AppState, Audius, Action<void>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const wallet = getState().account.wallet
      if (!wallet) throw new Error('Not signed in')
      await aud.ServiceProviderClient.cancelDecreaseStakeRequest(wallet)

      // Repull pending transactions
      await dispatch(fetchPendingTransactions(wallet))

      setStatus(Status.Success)
    } catch (error) {
      console.log(error)
      setStatus(Status.Failure)
    }
  }
}

function cancelUpdateOperatorCut(
  setStatus: (status: Status) => void,
  setError: (error: string) => void
): ThunkAction<void, AppState, Audius, Action<void>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const wallet = getState().account.wallet
      if (!wallet) throw new Error('Not signed in')
      await aud.ServiceProviderClient.cancelUpdateDeployerCut(wallet)

      // Repull pending transactions
      await dispatch(fetchPendingTransactions(wallet))

      setStatus(Status.Success)
    } catch (error) {
      console.log(error)
      setStatus(Status.Failure)
    }
  }
}

function cancelUndelegate(
  setStatus: (status: Status) => void,
  setError: (error: string) => void
): ThunkAction<void, AppState, Audius, Action<void>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const wallet = getState().account.wallet
      if (!wallet) throw new Error('Not signed in')

      await aud.Delegate.cancelUndelegateStake()
      // Repull pending transactions
      await dispatch(fetchPendingTransactions(wallet))

      setStatus(Status.Success)
    } catch (error) {
      console.log(error)
      setStatus(Status.Failure)
    }
  }
}

function cancelRemoveDelegator(
  wallet: Address,
  setStatus: (status: Status) => void,
  setError: (error: string) => void
): ThunkAction<void, AppState, Audius, Action<void>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const accountWallet = getState().account.wallet
      if (!accountWallet) throw new Error('Not signed in')
      if (!wallet) throw new Error('Delegator wallet not provided')
      await aud.Delegate.cancelRemoveDelegator(accountWallet, wallet)

      // Repull pending transactions
      await dispatch(fetchPendingTransactions(accountWallet))

      setStatus(Status.Success)
    } catch (error) {
      console.log(error)
      setStatus(Status.Failure)
    }
  }
}

export const useCancelTransaction = (name: PendingTransactionName) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()

  const cancelTransaction = useCallback(
    (wallet?: Address) => {
      if (status !== Status.Loading) {
        switch (name) {
          case PendingTransactionName.DecreaseStake: {
            dispatch(cancelDecreaseStake(setStatus, setError))
            break
          }
          case PendingTransactionName.UpdateOperatorCut: {
            dispatch(cancelUpdateOperatorCut(setStatus, setError))
            break
          }
          case PendingTransactionName.Undelegate: {
            dispatch(cancelUndelegate(setStatus, setError))
            break
          }
          case PendingTransactionName.RemoveDelegator: {
            dispatch(cancelRemoveDelegator(wallet!, setStatus, setError))
            break
          }
        }
      }
    },
    [dispatch, name, status, setStatus, setError]
  )
  return { status, error, setError, setStatus, cancelTransaction }
}
