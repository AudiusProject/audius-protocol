import { CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY } from './constants'
import type { User } from './utils'
import type { LocalStorage } from './utils/localStorage'

export type CurrentUser = User & {
  wallet?: string
  blocknumber?: number
  track_blocknumber?: number
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
  web3User: CurrentUser | null
  localStorage?: LocalStorage

  constructor({ localStorage }: UserStateManagerConfig) {
    // Should reflect the same fields as discovery node's /users?handle=<handle>
    this.currentUser = null
    this.web3User = null
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

  setWeb3User(user: CurrentUser) {
    this.web3User = user
  }

  getCurrentUser() {
    return this.currentUser
  }

  getWeb3User() {
    return this.web3User
  }

  getCurrentUserId() {
    return this.currentUser ? this.currentUser.user_id : null
  }

  getWeb3UserId() {
    return this.web3User ? this.web3User.user_id : null
  }

  async clearUser() {
    this.currentUser = null
    this.web3User = null
    if (this.localStorage) {
      await this.localStorage.removeItem(CURRENT_USER_EXISTS_LOCAL_STORAGE_KEY)
    }
  }
}
