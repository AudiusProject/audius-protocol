import { CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY } from './constants'

const supportsLocalStorage = () =>
  typeof window !== 'undefined' && window && window.localStorage

export type CurrentUser = {
  user_id: string
  wallet: string
  blocknumber: number
  track_blocknumber: number
  creator_node_endpoint: string
  is_creator: boolean
}

/**
 * Singleton class to store the current user if initialized.
 * Some instances of AudiusLibs and services require a current user to
 * return valid queries, e.g. requesting the a discprov to return a reposted track.
 */
export class UserStateManager {
  currentUser: CurrentUser | null

  constructor() {
    // Should reflect the same fields as discovery node's /users?handle=<handle>
    this.currentUser = null
  }

  /**
   * Sets this.currentUser with currentUser
   * @param {Object} currentUser fields to override this.currentUser with
   */
  setCurrentUser(currentUser: CurrentUser) {
    this.currentUser = currentUser
    if (supportsLocalStorage()) {
      window.localStorage.setItem(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY, 'true')
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  getCurrentUserId() {
    return this.currentUser ? this.currentUser.user_id : null
  }

  clearUser() {
    this.currentUser = null
    if (supportsLocalStorage()) {
      window.localStorage.removeItem(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY)
    }
  }
}
