import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status, ServiceType, BigNumber, Address } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { getAccountWallet } from 'store/account/hooks'
import { fetchUser } from 'store/cache/user/hooks'
import { getDiscoveryProvider } from 'store/cache/discoveryProvider/hooks'
import { getCreatorNode } from 'store/cache/creatorNode/hooks'

function registerAudiusService(
  serviceType: ServiceType,
  endpoint: string,
  stakingAmount: BigNumber,
  delegateOwnerWallet: string | undefined,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      let spID
      if (!!delegateOwnerWallet) {
        const res = await aud.ServiceProviderClient.registerWithDelegate(
          serviceType,
          endpoint,
          stakingAmount,
          delegateOwnerWallet
        )
        spID = res.spID
      } else {
        const res = await aud.ServiceProviderClient.register(
          serviceType,
          endpoint,
          stakingAmount
        )
        spID = res.spID
      }
      // Repull pending transactions
      const state = getState()
      const wallet = getAccountWallet(state)
      if (wallet) await dispatch(fetchUser(wallet))
      if (serviceType === ServiceType.DiscoveryProvider) {
        await dispatch(getDiscoveryProvider(spID))
      } else {
        await dispatch(getCreatorNode(spID))
      }

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useRegisterService = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const registerService = useCallback(
    (
      serviceType: ServiceType,
      endpoint: string,
      stakingAmount: BigNumber,
      delegateOwnerWallet: Address
    ) => {
      if (status !== Status.Loading) {
        dispatch(
          registerAudiusService(
            serviceType,
            endpoint,
            stakingAmount,
            delegateOwnerWallet,
            setStatus,
            setError
          )
        )
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, registerService }
}
