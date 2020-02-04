import { toStr } from './util'

/** Retrieves user from factory contract
  * @param {number} userId
  * @param {object} userFactory, deployed UserFactory truffle contract
  * @returns {object} dictionary with wallet, multihashDigest
  */
export const getUserFromFactory = async (userId, userFactory) => {
  let user = await userFactory.getUser.call(userId)
  return {
    wallet: user[0],
    handle: toStr(user[1])
  }
}
/** Retrieves track from factory contract
    * @param {number} trackId
    * @param {object} trackFactory, deployed TrackFactory truffle contract
    * @returns {object} dictionary with userId, multihashDigest, multihashHashFn, multihashSize
    */
export const getTrackFromFactory = async (trackId, trackFactory) => {
  let track = await trackFactory.getTrack.call(trackId)
  return {
    trackOwnerId: track[0],
    multihashDigest: track[1],
    multihashHashFn: track[2],
    multihashSize: track[3]
  }
}

/** Retrieves discovery provider from DiscoveryProviderFactory contract
    * @param {number} discprovId
    * @param {object} discprovFactory, deployed DiscoveryProvider truffle contract
    * @returns {object} dictionary with wallet address, discprov endpoint
    */
export const getDiscprovFromFactory = async (discprovId, discprovFactory) => {
  let discprov = await discprovFactory.getDiscoveryProvider.call(discprovId)
  return {
    wallet: discprov[0],
    endpoint: discprov[1]
  }
}

/** Get network id for contract instance - very truffle-specific and may not work in other
 * instances
 */
export const getNetworkIdForContractInstance = (contract) => {
  return contract.constructor.network_id
}
