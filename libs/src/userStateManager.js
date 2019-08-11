/**
 * Singleton class to store the current user if initialized.
 * Some instances of AudiusLibs and services require a current user to
 * return valid queries, e.g. requesting the a discprov to return a reposted track.
 */
class UserStateManager {
  constructor () {
    this.currentUser = null
  }

  setCurrentUser (currentUser) {
    this.currentUser = currentUser
  }

  getCurrentUser () {
    return this.currentUser
  }

  getCurrentUserId () {
    return this.currentUser ? this.currentUser.user_id : null
  }
}

module.exports = UserStateManager
