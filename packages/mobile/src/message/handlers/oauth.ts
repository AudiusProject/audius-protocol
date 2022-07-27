import * as oauthActions from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.REQUEST_TWITTER_AUTH]: ({ message, dispatch }) => {
    return dispatch(oauthActions.openPopup(message, Provider.TWITTER))
  },
  [MessageType.REQUEST_TWITTER_AUTH_SUCCEEDED]: ({ message, dispatch }) => {
    return dispatch(
      oauthActions.setTwitterInfo(
        message.uuid,
        message.profile,
        message.profileImage,
        message.profileBanner,
        message.requiresUserReview
      )
    )
  },
  [MessageType.REQUEST_TWITTER_AUTH_FAILED]: ({ message, dispatch }) => {
    return dispatch(oauthActions.setTwitterError(message.error))
  },
  [MessageType.REQUEST_INSTAGRAM_AUTH]: ({ message, dispatch }) => {
    return dispatch(oauthActions.openPopup(message, Provider.INSTAGRAM))
  },
  [MessageType.REQUEST_INSTAGRAM_AUTH_SUCCEEDED]: ({ message, dispatch }) => {
    return dispatch(
      oauthActions.setInstagramInfo(
        message.uuid,
        message.profile,
        message.profileImage,
        message.requiresUserReview
      )
    )
  },
  [MessageType.REQUEST_INSTAGRAM_AUTH_FAILED]: ({ message, dispatch }) => {
    return dispatch(oauthActions.setInstagramError(message.error))
  },
  [MessageType.REQUEST_TIKTOK_AUTH]: ({ message, dispatch }) => {
    return dispatch(oauthActions.openPopup(message, Provider.TIKTOK))
  }
}
