const { Base, Services } = require('./base')
const CreatorNodeService = require('../services/creatorNode/index')

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
        this.creatorNode.setEndpoint(CreatorNodeService.getPrimary(creatorNodeEndpoint))
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
        // Create the user with the creator node.
        if (this.web3Manager.web3IsExternal()) {
          this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE)

          phase = phases.ADD_CREATOR
          userId = await this.User.addCreator(metadata)

          phase = phases.CREATE_USER_RECORD
          await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        } else {
          this.REQUIRES(Services.CREATOR_NODE, Services.IDENTITY_SERVICE, Services.HEDGEHOG)

          phase = phases.HEDGEHOG_SIGNUP
          const ownerWallet = await this.hedgehog.signUp(email, password)
          await this.web3Manager.setOwnerWallet(ownerWallet)

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_CREATOR
          userId = await this.User.addCreator(metadata)
        }
      } else {
        // The creator node is not needed.
        if (this.web3Manager.web3IsExternal()) {
          this.REQUIRES(Services.IDENTITY_SERVICE)

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_USER
          userId = await this.User.addUser(metadata)

          phase = phases.CREATE_USER_RECORD
          await this.identityService.createUserRecord(email, this.web3Manager.getWalletAddress())
        } else {
          this.REQUIRES(Services.IDENTITY_SERVICE, Services.HEDGEHOG)

          phase = phases.HEDGEHOG_SIGNUP
          const ownerWallet = await this.hedgehog.signUp(email, password)
          await this.web3Manager.setOwnerWallet(ownerWallet)

          phase = phases.UPLOAD_PROFILE_IMAGES
          metadata = await this.User.uploadProfileImages(profilePictureFile, coverPhotoFile, metadata)

          phase = phases.ADD_USER
          userId = await this.User.addUser(metadata)
        }
      }
    } catch (err) {
      return { error: err.message, phase }
    }

    metadata['user_id'] = userId
    this.userStateManager.setCurrentUser(metadata)

    return { userId, error: false }
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

  /**
   * Perform a tags-only search. Returns tracks with required tag and users
   * that have used a tag greater than a specified number of times
   * @param {string} text search query
   * @param {number} user_tag_count min # of times a user must have used a tag to be returned
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchTags (text, user_tag_count = 2, limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.searchTags(text, user_tag_count, limit, offset)
  }
}

module.exports = Account
