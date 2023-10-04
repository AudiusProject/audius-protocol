import { useState, useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import { Status, Vote } from '../../types'
import Audius from '../../services/Audius'
import { AppState } from '../../store/types'
import { fetchVotes } from '../../store/cache/votes/hooks'
import { fetchProposal } from '../../store/cache/proposals/hooks'

function submitAudiusVote(
  proposalId: number,
  vote: Vote,
  currentVote: Vote,
  setStatus: (status: Status) => void,
  setError: (msg: string) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    setStatus(Status.Loading)
    try {
      if (currentVote) {
        await aud.Governance.updateVote({ proposalId, vote })
      } else {
        await aud.Governance.submitVote({ proposalId, vote })
      }

      // Repull proposal
      await dispatch(fetchVotes(proposalId))
      await dispatch(fetchProposal(proposalId))

      setStatus(Status.Success)
    } catch (err) {
      setStatus(Status.Failure)
      setError(err.message)
    }
  }
}

export const useSubmitVote = (shouldReset?: boolean) => {
  const [status, setStatus] = useState<undefined | Status>()
  const [error, setError] = useState<string>('')
  const dispatch = useDispatch()

  useEffect(() => {
    if (shouldReset) {
      setStatus(undefined)
      setError('')
    }
  }, [shouldReset, setStatus, setError])

  const submitVote = useCallback(
    (proposalId: number, vote: Vote, currentVote: Vote) => {
      dispatch(
        submitAudiusVote(proposalId, vote, currentVote, setStatus, setError)
      )
    },
    [dispatch, setStatus, setError]
  )

  return { status, error, submitVote }
}
