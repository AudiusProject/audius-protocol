import * as lifecycleActions from '../../store/lifecycle/actions'
import * as signonActions from '../../store/signon/actions'
import * as oauthActions from '../../store/oauth/actions'
import { checkConnectivity, Connectivity } from '../../utils/connectivity'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.BACKEND_SETUP]: ({ dispatch }) => {
    dispatch(lifecycleActions.backendLoaded())
  },
  [MessageType.RELOAD]: ({ dispatch, reload }) => {
    dispatch(lifecycleActions.backendTearDown())
    reload()
  },
  [MessageType.SIGNED_IN]: ({ message, dispatch }) => {
    dispatch(lifecycleActions.signedIn(message.account))
  },
  [MessageType.SIGNED_OUT]: ({ message, dispatch }) => {
    dispatch(lifecycleActions.signedOut(message.account))
    dispatch(signonActions.resetSignonState())
    dispatch(oauthActions.resetOAuthState())
  },
  [MessageType.FETCH_ACCOUNT_FAILED]: ({ dispatch }) => {
    dispatch(lifecycleActions.fetchAccountFailed())
  },
  [MessageType.REQUEST_NETWORK_CONNECTED]: ({ postMessage }) => {
    const isConnected = checkConnectivity(Connectivity.netInfo)
    postMessage({
      type: MessageType.IS_NETWORK_CONNECTED,
      isConnected,
      isAction: true
    })
  },
  [MessageType.ON_FIRST_PAGE]: ({ dispatch }) => {
    dispatch(lifecycleActions.onFirstPage())
  },
  [MessageType.NOT_ON_FIRST_PAGE]: ({ dispatch }) => {
    dispatch(lifecycleActions.notOnFirstPage())
  },
  [MessageType.CHANGED_PAGE]: ({ message, dispatch }) => {
    dispatch(lifecycleActions.changedPage(message.location))
  }
}
