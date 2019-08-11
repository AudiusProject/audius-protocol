const { Base, Services } = require('./base')

class Account extends Base {
  constructor (userApi, ...services) {
    super(...services)

    this.User = userApi
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
    if (!this.web3Manager.web3IsExternal()) {
      this.REQUIRES(Services.HEDGEHOG)

      const ownerWallet = await this.hedgehog.login(email, password)
      await this.web3Manager.setOwnerWallet(ownerWallet)
    }

    const users = await this.discoveryProvider.getUsers(1, 0, null, this.web3Manager.getWalletAddress())
    if (users && users[0]) {
      this.userStateManager.setCurrentUser(users[0])
      const creatorNodeEndpoint = users[0].creator_node_endpoint
      if (creatorNodeEndpoint) {
        this.creatorNode.setEndpoint(creatorNodeEndpoint)
      }
    }
  }

  /**
   * Signs a user up for Audius
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata
   * @param {?boolean} isCreator whether or not the user is a content creator.
   * @param {?File} profilePictureFile an optional file to upload as the profile picture
   * @param {?File} coverPhotoFile an optional file to upload as the cover phtoo
   */
  async signUp (
    email,
    password,
    metadata,
    isCreator = false,
    profilePictureFile = null,
    coverPhotoFile = null
  ) {
    let userId

    if (isCreator) {
      // Create the user with the creator node.
      if (this.web3Manager.web3IsExternal()) {
        this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE)

        userId = await this.User.addCreator(metadata)
        await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        await this.identityService.associate(email, metadata.handle, this.web3Manager)
      } else {
        this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE, Services.HEDGEHOG)

        const ownerWallet = await this.hedgehog.signUp(email, password)
        await this.web3Manager.setOwnerWallet(ownerWallet)

        metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)
        userId = await this.User.addCreator(metadata)
        await this.identityService.associate(email, metadata.handle, this.web3Manager)
      }
    } else {
      // The creator node is not needed.
      if (this.web3Manager.web3IsExternal()) {
        this.REQUIRES(Services.IDENTITY_SERVICE)

        userId = await this.User.addUser(metadata)
        await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        await this.identityService.associate(email, metadata.handle, this.web3Manager)
      } else {
        this.REQUIRES(Services.IDENTITY_SERVICE, Services.HEDGEHOG)

        const ownerWallet = await this.hedgehog.signUp(email, password)
        await this.web3Manager.setOwnerWallet(ownerWallet)

        metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)
        userId = await this.User.addUser(metadata)
        await this.identityService.associate(email, metadata.handle, this.web3Manager)
      }
    }

    metadata['user_id'] = userId
    this.userStateManager.setCurrentUser(metadata)

    return userId
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

  async getAuthMigrationStatus (handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.getAuthMigrationStatus(handle)
  }

  async setAuthMigration (email, password, handle) {
    this.REQUIRES(Services.IDENTITY_SERVICE, Services.HEDGEHOG)

    const authMigrationData = await this.hedgehog.getAuthMigrationData(email, password, handle)
    this.identityService.setAuthMigration(email, password, authMigrationData)
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
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchFull (text, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchFull(text, limit, offset)
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
}

module.exports = Account
