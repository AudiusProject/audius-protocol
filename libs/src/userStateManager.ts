import { CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY } from './constants'
import { LocalStorage } from './utils/localStorage'

export type CurrentUser = {
  user_id: string
  wallet: string
  blocknumber: number
  track_blocknumber: number
  creator_node_endpoint: string
  is_creator: boolean
}

type UserStateManagerConfig = {
  localStorage?: LocalStorage
}

/**
 * Singleton class to store the current user if initialized.
 * Some instances of AudiusLibs and services require a current user to
 * return valid queries, e.g. requesting the a discprov to return a reposted track.
 */
export class UserStateManager {
  currentUser: CurrentUser | null
  localStorage?: LocalStorage

  constructor({ localStorage }: UserStateManagerConfig) {
    // Should reflect the same fields as discovery node's /users?handle=<handle>
    this.currentUser = null
    this.localStorage = localStorage
  }

  /**
   * Sets this.currentUser with currentUser
   * @param {Object} currentUser fields to override this.currentUser with
   */
  async setCurrentUser(currentUser: CurrentUser) {
    this.currentUser = currentUser
    if (this.localStorage) {
      await this.localStorage.setItem(
        CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY,
        'true'
      )
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  getCurrentUserId() {
    return this.currentUser ? this.currentUser.user_id : null
  }

  async clearUser() {
    this.currentUser = null
    if (this.localStorage) {
      await this.localStorage.removeItem(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY)
    }
  }
}
