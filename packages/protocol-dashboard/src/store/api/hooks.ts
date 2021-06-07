import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from '@apollo/client'
import { setDidError } from './slice'
import { AppState } from 'store/types'

// -------------------------------- Selectors  --------------------------------
export const getGraphAPI = (state: AppState) => state.api
export const getDidGraphError = (state: AppState) => state.api.didError

// -------------------------------- Hooks  --------------------------------
export const useGraphQuery: typeof useQuery = (...args) => {
  const result = useQuery(...args)
  const didError = useSelector(getDidGraphError)
  const dispatch = useDispatch()

  if (!result.loading && !didError && result.error) {
    dispatch(setDidError())
  }

  return result
}
