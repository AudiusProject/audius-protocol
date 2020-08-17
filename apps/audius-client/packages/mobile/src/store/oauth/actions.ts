import { Message } from "../../message"

export const OPEN_POPUP = 'OAUTH/OPEN_POPUP'
export const CLOSE_POPUP = 'OAUTH/CLOSE_POPUP'

type OpenPopupAction = {
  type: typeof OPEN_POPUP
  message: Message
}

type ClosePopupAction = {
  type: typeof CLOSE_POPUP
}

export type OAuthActions =
  OpenPopupAction |
  ClosePopupAction

export const openPopup = (message: Message): OpenPopupAction => ({
  type: OPEN_POPUP,
  message
})

export const closePopup = (): ClosePopupAction => ({
  type: CLOSE_POPUP
})
