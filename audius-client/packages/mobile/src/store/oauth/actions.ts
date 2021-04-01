import { Message } from '../../message'
import { Provider } from './reducer'

export const OPEN_POPUP = 'OAUTH/OPEN_POPUP'
export const CLOSE_POPUP = 'OAUTH/CLOSE_POPUP'

type OpenPopupAction = {
  type: typeof OPEN_POPUP
  message: Message
  provider: Provider
}

type ClosePopupAction = {
  type: typeof CLOSE_POPUP
}

export type OAuthActions = OpenPopupAction | ClosePopupAction

export const openPopup = (
  message: Message,
  provider: Provider
): OpenPopupAction => ({
  type: OPEN_POPUP,
  message,
  provider
})

export const closePopup = (): ClosePopupAction => ({
  type: CLOSE_POPUP
})
