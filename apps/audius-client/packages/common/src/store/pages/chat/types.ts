/** Action current user can take to be able to message another user */
export enum ChatPermissionAction {
  /** Current user already can chat */
  NOT_APPLICABLE,
  /** Nothing current user can do (they're blocked or other user has closed inbox) */
  NONE,
  /** Current user can change inbox settings from FOLLOWEES or follow the user */
  FOLLOW_OR_CHANGE_SETTINGS,
  /** Current user can tip user */
  TIP,
  /** Current user can change inbox settings from NONE */
  CHANGE_SETTINGS,
  /** Current user can unblock user */
  UNBLOCK,
  /** User is signed out and needs to sign in */
  SIGN_UP
}
