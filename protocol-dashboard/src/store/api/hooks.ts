import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from '@apollo/client'
import { setDidError } from './slice'
import { AppState } from 'store/types'
import { ThunkDispatch } from 'redux-thunk'
import Audius from 'services/Audius'
import { AnyAction } from '@reduxjs/toolkit'

// -------------------------------- Selectors  --------------------------------
export const getGraphAPI = (state: AppState) => state.api
export const getDidGraphError = (state: AppState) => state.api.didError

// -------------------------------- Hooks  --------------------------------
export const useGraphQuery: typeof useQuery = (...args) => {
  const result = useQuery(...args)
  const didError = useSelector(getDidGraphError)
  const dispatch: ThunkDispatch<AppState, Audius, AnyAction> = useDispatch()

  if (!result.loading && !didError && result.error) {
    dispatch(setDidError())
  }

  return result
}
