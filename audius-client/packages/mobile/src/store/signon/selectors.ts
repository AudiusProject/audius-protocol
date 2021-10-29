import { createSelector } from 'reselect'
import { AppState } from '../'

export const getBaseState = (state: AppState) => state.signon

export const getIsSigninError = (state: AppState) => getBaseState(state).isError
export const getEmailIsAvailable = (state: AppState) =>
  getBaseState(state).emailIsAvailable
export const getEmailIsValid = (state: AppState) =>
  getBaseState(state).emailIsValid
export const getEmailStatus = (state: AppState) =>
  getBaseState(state).emailStatus
export const getHandleIsValid = (state: AppState) =>
  getBaseState(state).handleIsValid
export const getHandleStatus = (state: AppState) =>
  getBaseState(state).handleStatus
export const getHandleError = (state: AppState) =>
  getBaseState(state).handleError
export const getUserId = (state: AppState) => getBaseState(state).userId
export const getUsersToFollow = (state: AppState) =>
  getBaseState(state).followArtists.usersToFollow
export const getAllFollowArtists = (state: AppState) =>
  getBaseState(state).followArtists
export const getAccountAvailable = (state: AppState) =>
  getBaseState(state).accountAvailable
export const getFinalEmail = (state: AppState) => getBaseState(state).finalEmail
export const getFinalHandle = (state: AppState) =>
  getBaseState(state).finalHandle

const getSuggestedFollowIds = (state: AppState) => {
  const { selectedCategory, categories } = getBaseState(state).followArtists
  return categories[selectedCategory] || []
}
export const makeGetFollowArtists = () =>
  createSelector(
    [getSuggestedFollowIds, getUsersToFollow],
    (artistIds: number[], users: any[]) =>
      artistIds.map(aId => users[aId]).filter(Boolean)
  )
