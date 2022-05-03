const { ContractClient } = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')
const { Utils } = require('../../utils')
const sigUtil = require('eth-sig-util')
const BufferSafe = require('safe-buffer').Buffer

class UserFactoryClient extends ContractClient {
  /* ------- GETTERS ------- */

  async getUser (userId) {
    const method = await this.getMethod('getUser', userId)
    return method.call()
  }

  /** valid = does not exist and meets handle requirements (defined on chain) */
  async handleIsValid (handle) {
    const method = await this.getMethod('handleIsValid',
      Utils.utf8ToHex(handle)
    )
    return method.call()
  }

  /* ------- SETTERS ------- */

  async addUser (handle) {
    Utils.checkStrLen(handle, 16)

    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getAddUserRequestData(
      chainId,
      contractAddress,
      handle,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod('addUser',
      this.web3Manager.getWalletAddress(),
      Utils.utf8ToHex(handle),
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateMultihash',
      userId,
      multihashDigest,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateName',
      userId,
      Utils.utf8ToHex(name),
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      txReceipt: tx,
      name: Utils.hexToUtf8(tx.events.UpdateName.returnValues._name)
    }
  }

  async updateLocation (userId, location) {
    const maxLength = 32
    Utils.checkStrLen(location, maxLength, /* minLen */ 0)

    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserLocationRequestData,
      userId,
      location
    )
    const method = await this.getMethod('updateLocation',
      userId,
      Utils.padRight(Utils.utf8ToHex(location), maxLength * 2),
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateBio',
      userId,
      bio,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateProfilePhoto',
      userId,
      profilePhotoMultihashDigest,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateCoverPhoto',
      userId,
      coverPhotoMultihashDigest,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const method = await this.getMethod('updateIsCreator',
      userId,
      isCreator,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
    const contractAddress = await this.getAddress()
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserVerifiedRequestData,
      userId,
      isVerified,
      privateKey
    )
    const method = await this.getMethod('updateIsVerified',
      userId,
      isVerified,
      nonce,
      sig
    )

    return [method.encodeABI(), contractAddress]
  }

  async updateCreatorNodeEndpoint (userId, creatorNodeEndpoint) {
    const [nonce, sig] = await this.getUpdateNonceAndSig(
      signatureSchemas.generators.getUpdateUserCreatorNodeRequestData,
      userId,
      creatorNodeEndpoint
    )
    const method = await this.getMethod('updateCreatorNodeEndpoint',
      userId,
      creatorNodeEndpoint,
      nonce,
      sig
    )
    const contractAddress = await this.getAddress()

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
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
  async getUpdateNonceAndSig (generatorFn, userId, newValue, privateKey) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = generatorFn(chainId, contractAddress, userId, newValue, nonce)
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
