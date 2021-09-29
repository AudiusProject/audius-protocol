const assert = require('assert')

const Users = require('./user.js')

describe('Users tests', () => {
  it('_addUserOperations finds latest block hash', async () => {
    // Initialize API with dummy services
    const UsersAPI = new Users(null, ...[
      /* userStateManager */ null,
      /* identityService */ null,
      /* hedgehog */ null,
      /* discoveryProvider */ null,
      /* web3Manager */ null,
      /* contracts */ {
        UserFactoryClient: {
          updateName: async () => ({
            txReceipt: {
              blockNumber: 1,
              blockHash: '0x1'
            }
          }),
          updateLocation: async () => ({
            txReceipt: {
              blockNumber: 3,
              blockHash: '0x3'
            }
          }),
          updateBio: async () => ({
            txReceipt: {
              blockNumber: 6,
              blockHash: '0x6'
            }
          }),
          updateProfilePhoto: async () => ({
            txReceipt: {
              blockNumber: 5,
              blockHash: '0x5'
            }
          }),
          updateCoverPhoto: async () => ({
            txReceipt: {
              blockNumber: 4,
              blockHash: '0x4'
            }
          }),
          updateIsCreator: async () => ({
            txReceipt: {
              blockNumber: 2,
              blockHash: '0x2'
            }
          })
        }
      },
      /* ethWeb3Manager */ null,
      /* ethContracts */ null,
      /* solanaWeb3Manager */ null,
      /* creatorNode */ null,
      /* comstock */ null,
      /* captcha */ null,
      /* isServer */ null
    ])

    const userId = 1
    const metadata = {
      [Users.USER_PROP_NAME_CONSTANTS.NAME]: 'Rob Stark',
      [Users.USER_PROP_NAME_CONSTANTS.LOCATION]: 'Winterfell',
      [Users.USER_PROP_NAME_CONSTANTS.BIO]: 'King in the North',
      [Users.USER_PROP_NAME_CONSTANTS.PROFILE_PICTURE_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      [Users.USER_PROP_NAME_CONSTANTS.COVER_PHOTO_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      [Users.USER_PROP_NAME_CONSTANTS.IS_CREATOR]: true
    }
    const {
      latestBlockNumber,
      latestBlockHash
    } = await UsersAPI._addUserOperations(userId, metadata)
    assert(latestBlockNumber === 6)
    assert(latestBlockHash === '0x6')
  })

  it('_updateUserOperations finds latest block hash', async () => {
    // Initialize API with dummy services
    const UsersAPI = new Users(null, ...[
      /* userStateManager */ null,
      /* identityService */ null,
      /* hedgehog */ null,
      /* discoveryProvider */ null,
      /* web3Manager */ null,
      /* contracts */ {
        UserFactoryClient: {
          updateName: async () => ({
            txReceipt: {
              blockNumber: 1,
              blockHash: '0x1'
            }
          }),
          updateLocation: async () => ({
            txReceipt: {
              blockNumber: 3,
              blockHash: '0x3'
            }
          }),
          updateBio: async () => ({
            txReceipt: {
              blockNumber: 6,
              blockHash: '0x6'
            }
          }),
          updateProfilePhoto: async () => ({
            txReceipt: {
              blockNumber: 5,
              blockHash: '0x5'
            }
          }),
          updateCoverPhoto: async () => ({
            txReceipt: {
              blockNumber: 4,
              blockHash: '0x4'
            }
          }),
          updateIsCreator: async () => ({
            txReceipt: {
              blockNumber: 2,
              blockHash: '0x2'
            }
          })
        }
      },
      /* ethWeb3Manager */ null,
      /* ethContracts */ null,
      /* solanaWeb3Manager */ null,
      /* creatorNode */ null,
      /* comstock */ null,
      /* captcha */ null,
      /* isServer */ null
    ])

    const userId = 1
    const oldMetadata = {
      [Users.USER_PROP_NAME_CONSTANTS.NAME]: 'Rob Stark',
      [Users.USER_PROP_NAME_CONSTANTS.LOCATION]: 'Winterfell',
      [Users.USER_PROP_NAME_CONSTANTS.BIO]: 'King in the North',
      [Users.USER_PROP_NAME_CONSTANTS.PROFILE_PICTURE_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      [Users.USER_PROP_NAME_CONSTANTS.COVER_PHOTO_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      [Users.USER_PROP_NAME_CONSTANTS.IS_CREATOR]: true
    }
    const newMetadata = {
      [Users.USER_PROP_NAME_CONSTANTS.NAME]: 'Jon Snow',
      [Users.USER_PROP_NAME_CONSTANTS.LOCATION]: 'Dragonstone',
      // Does not change
      [Users.USER_PROP_NAME_CONSTANTS.BIO]: 'King in the North',
      [Users.USER_PROP_NAME_CONSTANTS.PROFILE_PICTURE_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWf',
      [Users.USER_PROP_NAME_CONSTANTS.COVER_PHOTO_SIZES]: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWf',
      [Users.USER_PROP_NAME_CONSTANTS.IS_CREATOR]: true
    }
    const {
      latestBlockNumber,
      latestBlockHash
    } = await UsersAPI._updateUserOperations(newMetadata, oldMetadata, userId)
    assert(latestBlockNumber === 5)
    assert(latestBlockHash === '0x5')
  })
})
