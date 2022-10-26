const assert = require('assert')

const { Users } = require('./Users')

describe('Users tests', () => {
  it('_addUserOperations finds latest block hash', async () => {
    // Initialize API with dummy services
    const UsersAPI = new Users(
      null,
      /* preferHigherPatchForPrimary */ true,
      /* preferHigherPatchForSecondaries */ true,
      ...[
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
      ]
    )

    const userId = 1
    const metadata = {
      name: 'Rob Stark',
      location: 'Winterfell',
      bio: 'King in the North',
      profile_picture_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      cover_photo_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo'
    }
    const { latestBlockNumber, latestBlockHash } =
      await UsersAPI._addUserOperations(userId, metadata)
    assert(latestBlockNumber === 6)
    assert(latestBlockHash === '0x6')
  })

  it('_updateUserOperations finds latest block hash', async () => {
    // Initialize API with dummy services
    const UsersAPI = new Users(
      null,
      /* preferHigherPatchForPrimary */ true,
      /* preferHigherPatchForSecondaries */ true,
      ...[
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
      ]
    )

    const userId = 1
    const oldMetadata = {
      name: 'Rob Stark',
      location: 'Winterfell',
      bio: 'King in the North',
      profile_picture_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo',
      cover_photo_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWo'
    }
    const newMetadata = {
      name: 'Jon Snow',
      location: 'Dragonstone',
      // Does not change
      bio: 'King in the North',
      profile_picture_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWf',
      cover_photo_sizes: 'QmUQSH4yKWLtykDuTmC17UKrCt1AiKhtjN7w1VHmpKfbWf'
    }
    const { latestBlockNumber, latestBlockHash } =
      await UsersAPI._updateUserOperations(newMetadata, oldMetadata, userId)
    assert(latestBlockNumber === 5)
    assert(latestBlockHash === '0x5')
  })
})
