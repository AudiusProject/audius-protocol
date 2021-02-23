import { web3New } from './web3New'

export const userStorageKey = web3New.utils.utf8ToHex('UserStorage')
export const userFactoryKey = web3New.utils.utf8ToHex('UserFactory')
export const trackStorageKey = web3New.utils.utf8ToHex('TrackStorage')
export const trackFactoryKey = web3New.utils.utf8ToHex('TrackFactory')
export const discoveryProviderStorageKey = web3New.utils.utf8ToHex('DiscoveryProviderStorage')
export const discoveryProviderFactoryKey = web3New.utils.utf8ToHex('DiscoveryProviderFactory')
export const playlistStorageKey = web3New.utils.utf8ToHex('PlaylistStorage')
export const playlistFactoryKey = web3New.utils.utf8ToHex('PlaylistFactory')
export const socialFeatureFactoryKey = web3New.utils.utf8ToHex('SocialFeatureFactory')
export const socialFeatureStorageKey = web3New.utils.utf8ToHex('SocialFeatureStorage')
export const ipldBlacklistFactorykey = web3New.utils.utf8ToHex('IPLDBlacklistFactory')
export const userLibraryFactoryKey = web3New.utils.utf8ToHex('UserLibraryFactory')
export const userReplicaSetManagerKey = web3New.utils.utf8ToHex('UserReplicaSetManager')
export const testStorageKey = web3New.utils.utf8ToHex('TestStorage')
export const testContractKey = web3New.utils.utf8ToHex('TestContract')

/** Constant string values */
export const strings = {
  first: web3New.utils.utf8ToHex('first'),
  second: web3New.utils.utf8ToHex('second'),
  third: web3New.utils.utf8ToHex('third'),
  test: web3New.utils.utf8ToHex('test')
}
export const testMultihash = {
  digest1: '0x697066735f6b6579000100000000000000000000000000000000000000000000',
  digest2: '0x697066735f6b6579000100000000000000000000000000000000000000000001',
  digest3: '0x697066735f6b6579000100000000000000000000000000000000000000000003',
  hashFn: 0,
  size: 8
}
export const userHandle1 = web3New.utils.utf8ToHex('userHandle1')
export const userHandle2 = web3New.utils.utf8ToHex('userHandle2_')
export const userHandleBad = web3New.utils.utf8ToHex('handleBoi!')
export const userHandleUC = web3New.utils.utf8ToHex('USER')
export const userHandleLC = web3New.utils.utf8ToHex('user')
export const userHandleMC = web3New.utils.utf8ToHex('User')
export const isCreatorFalse = false
export const isCreatorTrue = true
export const userMetadata = {
  name: web3New.utils.padRight(web3New.utils.utf8ToHex('Firstname Lastname'), 64),
  location: web3New.utils.padRight(web3New.utils.utf8ToHex('San Francisco'), 64),
  bio: 'I\'m A VERY INTERESTING PERSON!!!',
  coverPhotoDigest: '0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e',
  profilePhotoDigest: '0x1a5a5d47bfca6be2872d8076920683a3ae112b455a7a444be5ebb84471b16c4e'
}
