import fs from 'fs'
import path from 'path'

import { beforeAll, expect, jest } from '@jest/globals'

import { Auth } from '../../services/Auth/Auth'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { EntityManager } from '../../services/EntityManager'
import { Logger } from '../../services/Logger'
import { Storage } from '../../services/Storage'
import { StorageNodeSelector } from '../../services/StorageNodeSelector'
import { Configuration } from '../generated/default'

import { UsersApi } from './UsersApi'

const pngFile = fs.readFileSync(
  path.resolve(__dirname, '../../test/png-file.png')
)

jest.mock('../../services/EntityManager')

jest.spyOn(Storage.prototype, 'uploadFile').mockImplementation(async () => {
  return {
    id: 'a',
    status: 'done',
    results: {
      '320': 'a'
    },
    probe: {
      format: {
        duration: '10'
      }
    }
  }
})

jest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      blockHash: 'a',
      blockNumber: 1
    } as any
  })

describe('UsersApi', () => {
  let users: UsersApi

  const auth = new Auth()
  const logger = new Logger()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector,
    logger
  })

  beforeAll(() => {
    users = new UsersApi(
      new Configuration(),
      discoveryNodeSelector,
      new Storage({ storageNodeSelector, logger: new Logger() }),
      new EntityManager({ discoveryNodeSelector: new DiscoveryNodeSelector() }),
      auth,
      new Logger()
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('updateProfile', () => {
    it('updates the user profile if valid metadata is provided', async () => {
      const result = await users.updateProfile({
        userId: '7eP5n',
        profilePictureFile: {
          buffer: pngFile,
          name: 'profilePicture'
        },
        coverArtFile: {
          buffer: pngFile,
          name: 'coverArt'
        },
        metadata: {
          name: 'name',
          bio: 'bio',
          location: 'location',
          artistPickTrackId: '7eP5n',
          isDeactivated: false
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('updates the user profile if partial valid metadata is provided', async () => {
      const result = await users.updateProfile({
        userId: '7eP5n',
        metadata: {
          bio: 'The bio has been updated'
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.updateProfile({
          userId: '7eP5n',
          metadata: {
            asdf: '123'
          } as any
        })
      }).rejects.toThrow()
    })

    it('throws an error if invalid request is sent', async () => {
      await expect(async () => {
        await users.updateProfile({
          metadata: { bio: 'New bio' }
        } as any)
      }).rejects.toThrow()
    })
  })

  describe('followUser', () => {
    it('follows a user if valid metadata is provided', async () => {
      const result = await users.followUser({
        userId: '7eP5n',
        followeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.followUser({
          userId: '7eP5n',
          followeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unfollowUser', () => {
    it('unfollows a user if valid metadata is provided', async () => {
      const result = await users.unfollowUser({
        userId: '7eP5n',
        followeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.unfollowUser({
          userId: '7eP5n',
          followeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('subscribeToUser', () => {
    it('subscribes to a user if valid metadata is provided', async () => {
      const result = await users.subscribeToUser({
        userId: '7eP5n',
        subscribeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.subscribeToUser({
          userId: '7eP5n',
          subscribeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unsubscribeFromUser', () => {
    it('unsubscribes from a user if valid metadata is provided', async () => {
      const result = await users.unsubscribeFromUser({
        userId: '7eP5n',
        subscribeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.unsubscribeFromUser({
          userId: '7eP5n',
          subscribeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
