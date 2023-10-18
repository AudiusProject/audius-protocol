/** Action current user can take to be able to message another user */
export enum ChatPermissionAction {
  /** Permissions haven't loaded yet */
  WAIT,
  /** Current user already can chat */
  NOT_APPLICABLE,
  /** Nothing current user can do (they're blocked or other user has closed inbox) */
  NONE,
  /** Current user can tip user */
  TIP,
  /** Current user can unblock user */
  UNBLOCK,
  /** User is signed out and needs to sign in */
  SIGN_UP
}

export type ChatMessageTileProps = {
  link: string
  styles?: any
  onEmpty?: () => void
  onSuccess?: () => void
  className?: string
}

export class ChatWebsocketError extends Error {
  constructor(public url?: string, public code?: string) {
    super(`Chat Websocket Error, code: ${code}`)
  }
}
