import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { Action } from 'redux'

import { Status } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { fetchProposal } from 'store/cache/proposals/hooks'
import { AnyAction } from '@reduxjs/toolkit'

function executeAudiusProposal(
  proposalId: number,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      await aud.Governance.evaluateProposalOutcome({ proposalId })

      // Repull proposal
      await dispatch(fetchProposal(proposalId))

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useExecuteProposal = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()

  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const executeProposal = useCallback(
    (proposalId: number) => {
      dispatch(executeAudiusProposal(proposalId, setStatus, setError))
    },
    [dispatch, setStatus, setError]
  )

  return { status, error, executeProposal }
}
