const signatureSchemas = require('../../../data-contracts/signatureSchemas')
const Utils = require('../../utils')
const sigUtil = require('eth-sig-util')
const BufferSafe = require('safe-buffer').Buffer

class UserFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.UserFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- GETTERS ------- */

  async getUser (userId) {
    return this.UserFactory.methods.getUser(userId).call()
  }

  /** valid = does not exist and meets handle requirements (defined on chain) */
  async handleIsValid (handle) {
    return this.UserFactory.methods.handleIsValid(
      Utils.utf8ToHex(handle)
    ).call()
  }

  /* ------- SETTERS ------- */

  async addUser (handle) {
    Utils.checkStrLen(handle, 16)

    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getAddUserRequestData(
      chainId,
      this.contractAddress,
      handle,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.UserFactory.methods.addUser(
      this.web3Manager.getWalletAddress(),
      Utils.utf8ToHex(handle),
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      userId: parseInt(tx.events.AddUser.returnValues._userId, 10)
    }
  }

  async updateMultihash (userId, multihashDigest) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserMultihashRequestData,
      userId,
      multihashDigest
    )
    const contractMethod = this.UserFactory.methods.updateMultihash(
      userId,
      multihashDigest,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      multihashDigest: tx.events.UpdateMultihash.returnValues._multihashDigest
    }
  }

  async updateName (userId, name) {
    Utils.checkStrLen(name, 32)

    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserNameRequestData,
      userId,
      name
    )
    const contractMethod = this.UserFactory.methods.updateName(
      userId,
      Utils.utf8ToHex(name),
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      name: Utils.hexToUtf8(tx.events.UpdateName.returnValues._name)
    }
  }

  async updateLocation (userId, location) {
    Utils.checkStrLen(location, 32)

    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserLocationRequestData,
      userId,
      location
    )
    const contractMethod = this.UserFactory.methods.updateLocation(
      userId,
      Utils.utf8ToHex(location),
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      location: Utils.hexToUtf8(tx.events.UpdateLocation.returnValues._location)
    }
  }

  async updateBio (userId, bio) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserBioRequestData,
      userId,
      bio
    )
    const contractMethod = this.UserFactory.methods.updateBio(
      userId,
      bio,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      bio: tx.events.UpdateBio.returnValues._bio
    }
  }

  async updateProfilePhoto (userId, profilePhotoMultihashDigest) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserProfilePhotoRequestData,
      userId,
      profilePhotoMultihashDigest
    )
    const contractMethod = this.UserFactory.methods.updateProfilePhoto(
      userId,
      profilePhotoMultihashDigest,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      profilePhotoMultihashDigest: tx.events.UpdateProfilePhoto.returnValues._profilePhotoDigest
    }
  }

  async updateCoverPhoto (userId, coverPhotoMultihashDigest) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserCoverPhotoRequestData,
      userId,
      coverPhotoMultihashDigest
    )
    const contractMethod = this.UserFactory.methods.updateCoverPhoto(
      userId,
      coverPhotoMultihashDigest,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      coverPhotoMultihashDigest: tx.events.UpdateCoverPhoto.returnValues._coverPhotoDigest
    }
  }

  async updateIsCreator (userId, isCreator) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserCreatorRequestData,
      userId,
      isCreator
    )
    const contractMethod = this.UserFactory.methods.updateIsCreator(
      userId,
      isCreator,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      isCreator: tx.events.UpdateIsCreator.returnValues._isCreator
    }
  }

  /**
   * This function is called from the identity service, not from the client. As a result,
   * the return properties are different. The web3 sendTransaction() function isn't called, rather
   * the encodedABI and contract address are returned, and the identity service can relay it
   * to the chain on behalf of the user
   * @param {number} userId blockchain userId
   * @param {Boolean} isVerified
   * @param {string} privateKey 64 character hex string
   */
  async updateIsVerified (userId, isVerified, privateKey) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserVerifiedRequestData,
      userId,
      isVerified,
      privateKey
    )
    const contractMethod = this.UserFactory.methods.updateIsVerified(
      userId,
      isVerified,
      nonce,
      sig
    )

    return [contractMethod.encodeABI(), this.contractAddress]
  }

  async updateCreatorNodeEndpoint (userId, creatorNodeEndpoint) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserCreatorNodeRequestData,
      userId,
      creatorNodeEndpoint
    )
    const contractMethod = this.UserFactory.methods.updateCreatorNodeEndpoint(
      userId,
      creatorNodeEndpoint,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return {
      txReceipt: tx,
      creatorNodeEndpoint: tx.events.UpdateCreatorNodeEndpoint.returnValues._creatorNodeEndpoint
    }
  }

  /* ------- HELPERS ------- */

  /**
   * Gets a nonce and generates a signature for the given function. Private key is optional and
   * will use that private key to create the signature. Otherwise the web3Manager private key
   * will be used.
   * @param {Object} generatorFn signature scheme object function
   * @param {number} userId blockchain userId
   * @param {Varies} newValue new value to set
   * @param {string} privateKey 64 character hex string
   */
  async getUpdateNonceAndSig (generatorFn, multihashDigest, newValue, privateKey) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3Manager.getWeb3().eth.net.getId()
    const signatureData = generatorFn(chainId, this.contractAddress, multihashDigest, newValue, nonce)
    let sig
    if (privateKey) {
      sig = sigUtil.signTypedData(BufferSafe.from(privateKey, 'hex'), { data: signatureData })
    } else {
      sig = await this.web3Manager.signTypedData(signatureData)
    }
    return [nonce, sig]
  }
}

module.exports = UserFactoryClient
