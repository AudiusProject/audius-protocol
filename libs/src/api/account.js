const { Base, Services } = require('./base')
const CreatorNodeService = require('../services/creatorNode/index')

class Account extends Base {
  constructor (userApi, ...services) {
    super(...services)

    this.User = userApi

    this.searchAutocomplete = this.searchAutocomplete.bind(this)
    this.getCurrentUser = this.getCurrentUser.bind(this)
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.signUp = this.signUp.bind(this)
    this.generateRecoveryLink = this.generateRecoveryLink.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.checkIfEmailRegistered = this.checkIfEmailRegistered.bind(this)
    this.associateTwitterUser = this.associateTwitterUser.bind(this)
    this.associateInstagramUser = this.associateInstagramUser.bind(this)
    this.handleIsValid = this.handleIsValid.bind(this)
    this.lookupTwitterHandle = this.lookupTwitterHandle.bind(this)
    this.updateCreatorNodeEndpoint = this.updateCreatorNodeEndpoint.bind(this)
    this.searchFull = this.searchFull.bind(this)
    this.searchAutocomplete = this.searchAutocomplete.bind(this)
    this.searchTags = this.searchTags.bind(this)
  }

  /**
   * Fetches the user metadata for the current account
   * @return {Object} user metadata
   */
  getCurrentUser () {
    return this.userStateManager.getCurrentUser()
  }

  /**
   * Logs a user into Audius
   * @param {string} email
   * @param {string} password
   */
  async login (email, password) {
    const phases = {
      FIND_WALLET: 'FIND_WALLET',
      FIND_USER: 'FIND_USER'
    }
    let phase = ''

    phase = phases.FIND_WALLET
    if (!this.web3Manager.web3IsExternal()) {
      this.REQUIRES(Services.HEDGEHOG)

      try {
        const ownerWallet = await this.hedgehog.login(email, password)
        await this.web3Manager.setOwnerWallet(ownerWallet)
      } catch (e) {
        return { error: e.message, phase }
      }
    }

    phase = phases.FIND_USER
    const userAccount = await this.discoveryProvider.getUserAccount(this.web3Manager.getWalletAddress())
    if (userAccount) {
      this.userStateManager.setCurrentUser(userAccount)
      const creatorNodeEndpoint = userAccount.creator_node_endpoint
      if (creatorNodeEndpoint) {
        this.creatorNode.setEndpoint(CreatorNodeService.getPrimary(creatorNodeEndpoint))
      }
      return { user: userAccount, error: false, phase }
    }
    return { error: 'No user found', phase }
  }

  /**
   * Logs a user out of Audius
   * Note: Actions will stop working at this point, but
   * clients may wish to call window.location.reload()
   * to show the user as logged out
   */
  logout () {
    if (!this.web3Manager.web3IsExternal()) {
      this.REQUIRES(Services.HEDGEHOG)
      this.hedgehog.logout()
      this.userStateManager.clearUser()
    }
  }

  /**
   * Signs a user up for Audius
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata
   * @param {?boolean} [isCreator] whether or not the user is a content creator.
   * @param {?File} [profilePictureFile] an optional file to upload as the profile picture
   * @param {?File} [coverPhotoFile] an optional file to upload as the cover phtoo
   * @param {?boolean} [hasWallet]
   * @param {?boolean} [host] The host url used for the recovery email
   */
  async signUp (
    email,
    password,
    metadata,
    isCreator = false,
    profilePictureFile = null,
    coverPhotoFile = null,
    hasWallet = false,
    host = (typeof window !== 'undefined' && window.location.origin) || null
  ) {
    let userId

    const phases = {
      ADD_CREATOR: 'ADD_CREATOR',
      CREATE_USER_RECORD: 'CREATE_USER_RECORD',
      HEDGEHOG_SIGNUP: 'HEDGEHOG_SIGNUP',
      UPLOAD_PROFILE_IMAGES: 'UPLOAD_PROFILE_IMAGES',
      ADD_USER: 'ADD_USER'
    }

    let phase = ''
    try {
      if (isCreator) {
        if (this.web3Manager.web3IsExternal()) {
          // Creator and external web3 (e.g. MetaMask)
          this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE)

          phase = phases.ADD_CREATOR
          userId = await this.User.addCreator(metadata)

          phase = phases.CREATE_USER_RECORD
          await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        } else {
          // Creator and identity service web3
          this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE, Services.HEDGEHOG)

          // If an owner wallet already exists, don't try to recreate it
          if (!hasWallet) {
            phase = phases.HEDGEHOG_SIGNUP
            const ownerWallet = await this.hedgehog.signUp(email, password)
            await this.web3Manager.setOwnerWallet(ownerWallet)
            await this.generateRecoveryLink({ handle: metadata.handle, host })
          }

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_CREATOR
          userId = await this.User.addCreator(metadata)
        }
      } else {
        if (this.web3Manager.web3IsExternal()) {
          // Non-creator and external web3 (e.g. MetaMask)
          this.REQUIRES(Services.IDENTITY_SERVICE)

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_USER
          userId = await this.User.addUser(metadata)

          phase = phases.CREATE_USER_RECORD
          await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        } else {
          // Non-creator and identity service web3
          this.REQUIRES(Services.IDENTITY_SERVICE, Services.HEDGEHOG)

          // If an owner wallet already exists, don't try to recreate it
          if (!hasWallet) {
            phase = phases.HEDGEHOG_SIGNUP
            const ownerWallet = await this.hedgehog.signUp(email, password)
            await this.web3Manager.setOwnerWallet(ownerWallet)
            await this.generateRecoveryLink({ handle: metadata.handle, host })
          }

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_USER
          userId = await this.User.addUser(metadata)
        }
      }
    } catch (err) {
      return { error: err.message, phase }
    }

    metadata.user_id = userId
    metadata.wallet = this.web3Manager.getWalletAddress()
    this.userStateManager.setCurrentUser(metadata)

    return { userId, error: false }
  }

  /**
   * Generates and sends a recovery email for a user
   * @param {string} [handle] The user handle, defaults to the current user handle
   * @param {string} [host] The host domain, defaults to window.location.origin
   */
  async generateRecoveryLink ({ handle, host } = {}) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    try {
      let recoveryInfo = await this.hedgehog.generateRecoveryInfo()
      handle = handle || this.userStateManager.getCurrentUser().handle

      const unixTs = Math.round((new Date()).getTime() / 1000) // current unix timestamp (sec)
      const data = `Click sign to authenticate with identity service: ${unixTs}`
      const signature = await this.web3Manager.sign(data)

      const recoveryData = {
        login: recoveryInfo.login,
        host: host || recoveryInfo.host,
        data,
        signature,
        handle
      }

      await this.identityService.sendRecoveryInfo(recoveryData)
    } catch (e) {
      console.error(e)
    }
  }

  async resetPassword (email, newpassword) {
    return this.hedgehog.resetPassword(email, newpassword)
  }

  /**
   * Check if an email address has been previously registered.
   * @param {string} email
   * @returns {{exists: boolean}}
   */
  async checkIfEmailRegistered (email) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.checkIfEmailRegistered(email)
  }

  /**
   * Associates a user with a twitter uuid.
   * @param {string} uuid from the Twitter API
   * @param {number} userId
   * @param {string} handle
   */
  async associateTwitterUser (uuid, userId, handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.associateTwitterUser(uuid, userId, handle)
  }

  /**
   * Associates a user with an instagram uuid.
   * @param {string} uuid from the Instagram API
   * @param {number} userId
   * @param {string} handle
   */
  async associateInstagramUser (uuid, userId, handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.associateInstagramUser(uuid, userId, handle)
  }

  /**
   * Checks if a requested handle is valid (unused).
   * @param {string} handle
   */
  async handleIsValid (handle) {
    return this.contracts.UserFactoryClient.handleIsValid(handle)
  }

  /**
   * Looks up a Twitter account by handle.
   * @returns {Object} twitter API response.
   */
  async lookupTwitterHandle (handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.lookupTwitterHandle(handle)
  }

  /**
   * Updates a user's creator node endpoint. Sets the connected creator node in the libs instance
   * and updates the user's metadata blob.
   * @param {string} url
   */
  async updateCreatorNodeEndpoint (url) {
    this.REQUIRES(Services.CREATOR_NODE)

    let user = this.userStateManager.getCurrentUser()
    if (user.is_creator) {
      await this.creatorNode.setEndpoint(url)
      // Only a creator will have a creator node endpoint
      user.creator_node_endpoint = url
      await this.User.updateCreator(user.user_id, user)
    }
  }

  /**
   * Perform a full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have all same data as returned from standalone endpoints
   * @param {string} text search query
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchFull (text, kind, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchFull(text, kind, limit, offset)
  }

  /**
   * Perform a lighter-weight full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have core data, and track & playlist objects
   *    also return user object
   * @param {string} text search query
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchAutocomplete (text, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchAutocomplete(text, limit, offset)
  }

  /**
   * Perform a tags-only search. Returns tracks with required tag and users
   * that have used a tag greater than a specified number of times
   * @param {string} text search query
   * @param {number} user_tag_count min # of times a user must have used a tag to be returned
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchTags (text, user_tag_count = 2, kind, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchTags(text, user_tag_count, kind, limit, offset)
  }
}

module.exports = Account
