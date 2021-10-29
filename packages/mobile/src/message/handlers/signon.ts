import * as signonActions from '../../store/signon/actions'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.SIGN_IN_FAILURE]: ({ dispatch, message }) => {
    dispatch(signonActions.signinFailed(message.error))
  },
  [MessageType.SIGN_UP_VALIDATE_EMAIL_FAILURE]: ({ dispatch, message }) => {
    dispatch(signonActions.signupValidateEmailFailed(message.error))
  },
  [MessageType.SIGN_UP_VALIDATE_EMAIL_SUCCESS]: ({ message, dispatch }) => {
    dispatch(signonActions.signupValidateEmailSuceeded(message.available))
  },
  [MessageType.SIGN_UP_VALIDATE_HANDLE_FAILURE]: ({ message, dispatch }) => {
    dispatch(signonActions.signupValidateHandleFailed(message.error))
  },
  [MessageType.SIGN_UP_VALIDATE_HANDLE_SUCCESS]: ({ dispatch, message }) => {
    dispatch(signonActions.signupValidateHandleSuceeded())
  },
  [MessageType.FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED]: ({ dispatch, message }) => {
    dispatch(
      signonActions.fetchAllFollowArtistsSucceeded(
        message.category,
        message.userIds
      )
    )
  },
  [MessageType.FETCH_ALL_FOLLOW_ARTISTS_FAILED]: ({ dispatch, message }) => {
    dispatch(signonActions.fetchAllFollowArtistsFailed(message.error))
  },
  [MessageType.SET_USERS_TO_FOLLOW]: ({ dispatch, message }) => {
    dispatch(signonActions.setUsersToFollow(message.users))
  },
  [MessageType.SET_ACCOUNT_AVAILABLE]: ({ dispatch, message }) => {
    dispatch(
      signonActions.setAccountAvailable(true, message.email, message.handle)
    )
  },
  [MessageType.SIGN_UP_SUCCESS]: ({ dispatch, message }) => {
    dispatch(signonActions.signupSuceeded(message.userId))
  }
}
