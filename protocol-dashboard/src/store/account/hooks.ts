import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { Action } from 'redux'

import {
  Status,
  Address,
  DelayedPendingTransaction,
  PendingTransactionName
} from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import {
  setLoading,
  setAccount,
  setPendingTransactionsLoading,
  setPendingTransactions
} from './slice'
import { useEffect } from 'react'
import { getUser, fetchUser } from 'store/cache/user/hooks'
import { AnyAction } from '@reduxjs/toolkit'
import BN from 'bn.js'

// -------------------------------- Selectors  --------------------------------
export const getIsLoggedIn = (state: AppState) => state.account.loggedIn
export const getAccountWallet = (state: AppState) => state.account.wallet
export const getAccountStatus = (state: AppState) => state.account.status
export const getPendingTransactions = (state: AppState) => ({
  status: Status.Success,
  transactions: [
    {
      name: PendingTransactionName.DecreaseStake,
      status: 'awer',
      wallet: '34',
      lockupDuration: 33,
      lockupExpiryBlock: 33,
      amount: new BN(33)
    }
  ]
})
export const getPendingClaim = (state: AppState) => state.account.pendingClaim
export const getIsAudiusProfileRefetchDisabled = (state: AppState) =>
  state.account.isAudiusProfileRefetchDisabled

// -------------------------------- Thunk Actions  --------------------------------

// Async function to get
export function fetchAccount(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    dispatch(setLoading())
    await aud.awaitSetup()
    if (aud.hasValidAccount) {
      const wallet = await aud.getEthWallet()
      dispatch(
        setAccount({
          status: Status.Success,
          wallet
        })
      )
    }
  }
}

export function fetchPendingTransactions(
  wallet: Address
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    await aud.awaitSetup()
    dispatch(setPendingTransactionsLoading())
    try {
      let pendingRequests: Array<DelayedPendingTransaction> = []

      const decreaseStakeReq = await aud.ServiceProviderClient.getPendingDecreaseStakeRequest(
        wallet
      )
      if (decreaseStakeReq.lockupExpiryBlock !== 0) {
        const lockupDuration = await aud.ServiceProviderClient.getDecreaseStakeLockupDuration()
        pendingRequests.push({
          name: PendingTransactionName.DecreaseStake,
          lockupDuration,
          ...decreaseStakeReq
        })
      }

      const updateDeployerCutReq = await aud.ServiceProviderClient.getPendingUpdateDeployerCutRequest(
        wallet
      )
      if (updateDeployerCutReq.lockupExpiryBlock !== 0) {
        const lockupDuration = await aud.ServiceProviderClient.getDeployerCutLockupDuration()
        pendingRequests.push({
          lockupDuration,
          name: PendingTransactionName.UpdateOperatorCut,
          ...updateDeployerCutReq
        })
      }

      const pendingUndelegateRequest = await aud.Delegate.getPendingUndelegateRequest(
        wallet
      )
      if (pendingUndelegateRequest.lockupExpiryBlock !== 0) {
        const lockupDuration = await aud.Delegate.getUndelegateLockupDuration()
        pendingRequests.push({
          lockupDuration,
          name: PendingTransactionName.Undelegate,
          ...pendingUndelegateRequest
        })
      }

      const delegators = await aud.Delegate.getDelegatorsList(wallet)
      if (delegators.length > 0) {
        const lockupDuration = await aud.Delegate.getRemoveDelegatorLockupDuration()

        for (let delegator of delegators) {
          const pendingRemoveDelegatorReq = await aud.Delegate.getPendingRemoveDelegatorRequest(
            wallet,
            delegator
          )
          if (pendingRemoveDelegatorReq.lockupExpiryBlock > 0) {
            pendingRequests.push({
              lockupDuration,
              name: PendingTransactionName.RemoveDelegator,
              target: delegator,
              ...pendingRemoveDelegatorReq
            })
          }
        }
      }

      dispatch(setPendingTransactions(pendingRequests))
    } catch (error) {
      // TODO: Handle error case
      console.log(error)
    }
  }
}

// -------------------------------- Hooks  --------------------------------
export const useAccount = () => {
  const isLoggedIn = useSelector(getIsLoggedIn)
  const wallet = useSelector(getAccountWallet)
  const status = useSelector(getAccountStatus)

  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()
  useEffect(() => {
    if (!status) {
      dispatch(fetchAccount())
    }
  }, [dispatch, status])

  return { isLoggedIn, status, wallet }
}

export const useAccountUser = () => {
  const isLoggedIn = useSelector(getIsLoggedIn)
  const wallet = useSelector(getAccountWallet)
  const [status, setStatus] = useState<Status | undefined>()
  const user = useSelector(getUser(wallet!))
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()
  useEffect(() => {
    if (isLoggedIn && !status && wallet) {
      dispatch(fetchUser(wallet, setStatus))
    }
  }, [dispatch, isLoggedIn, status, wallet, setStatus])

  if (user) return { status: Status.Success, user }
  return { status, user }
}

// Fetch the pending transactions
export const usePendingTransactions = () => {
  const wallet = useSelector(getAccountWallet)
  const pendingTransactions = useSelector(getPendingTransactions)
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()
  useEffect(() => {
    if (wallet && pendingTransactions.status === undefined) {
      dispatch(fetchPendingTransactions(wallet))
    }
  }, [dispatch, wallet, pendingTransactions])

  return pendingTransactions
}

export const useHasPendingDecreaseStakeTx = () => {
  const pendingTransactions = usePendingTransactions()
  if (pendingTransactions.status === Status.Success) {
    const hasPendingDecreaseTx =
      pendingTransactions.transactions?.some(tx => {
        return tx.name === PendingTransactionName.DecreaseStake
      }) ?? false
    return { status: Status.Success, hasPendingDecreaseTx }
  }
  return { status: Status.Loading, hasPendingDecreaseTx: true }
}

export const useHasPendingDecreaseDelegationTx = () => {
  const pendingTransactions = usePendingTransactions()
  if (pendingTransactions.status === Status.Success) {
    const hasPendingDecreaseTx =
      pendingTransactions.transactions?.some(tx => {
        return tx.name === PendingTransactionName.Undelegate
      }) ?? false
    return { status: Status.Success, hasPendingDecreaseTx }
  }
  return { status: Status.Loading, hasPendingDecreaseTx: true }
}
