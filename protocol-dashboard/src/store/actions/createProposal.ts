import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { fetchActiveProposals } from 'store/cache/proposals/hooks'

function createAudiusProposal(
  targetContractName: string,
  signature: string,
  callData: any[],
  name: string,
  description: string,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      const proposal = {
        targetContractName: targetContractName,
        functionSignature: signature,
        callData,
        name,
        description
      }
      await aud.Governance.submitProposal(proposal)

      // Repull proposal
      await dispatch(fetchActiveProposals())

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useCreateProposal = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()

  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  useEffect(() => {
    if (status === Status.Success) {
    }
  }, [status])

  const createProposal = useCallback(
    (
      targetContractName: string,
      signature: string,
      callData: any[],
      name: string,
      description: string
    ) => {
      dispatch(
        createAudiusProposal(
          targetContractName,
          signature,
          callData,
          name,
          description,
          setStatus,
          setError
        )
      )
    },
    [dispatch, setStatus, setError]
  )

  return { status, error, createProposal }
}
