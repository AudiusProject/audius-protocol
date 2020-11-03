import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status, ServiceType, Address } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { getDiscoveryProvider } from 'store/cache/discoveryProvider/hooks'
import { getContentNode } from 'store/cache/contentNode/hooks'

function modifyAudiusService(
  serviceType: ServiceType,
  spID: number,
  oldEndpoint: string,
  newEndpoint: string,
  oldDelegateOwnerWallet: Address,
  newDelegateOwnerWallet: Address,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      if (
        newDelegateOwnerWallet &&
        oldDelegateOwnerWallet !== newDelegateOwnerWallet
      ) {
        await aud.ServiceProviderClient.updateDelegateOwnerWallet(
          serviceType,
          oldEndpoint,
          newDelegateOwnerWallet
        )
      }
      if (newEndpoint && oldEndpoint !== newEndpoint) {
        await aud.ServiceProviderClient.updateEndpoint(
          serviceType,
          oldEndpoint,
          newEndpoint
        )
      }
      if (serviceType === ServiceType.DiscoveryProvider) {
        dispatch(getDiscoveryProvider(spID))
      } else {
        dispatch(getContentNode(spID))
      }

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useModifyService = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()
  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const modifyService = useCallback(
    (
      serviceType: ServiceType,
      spID: number,
      oldEndpoint: string,
      newEndpoint: string,
      oldDelegateOwnerWallet: Address,
      delegateOwnerWallet: Address
    ) => {
      if (status !== Status.Loading) {
        dispatch(
          modifyAudiusService(
            serviceType,
            spID,
            oldEndpoint,
            newEndpoint,
            oldDelegateOwnerWallet,
            delegateOwnerWallet,
            setStatus,
            setError
          )
        )
      }
    },
    [dispatch, status, setStatus, setError]
  )
  return { status, error, modifyService }
}
