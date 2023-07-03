import { Auth } from '../../services/Auth/Auth'
import { beforeAll, expect, jest } from '@jest/globals'
import { Configuration } from '../generated/default'
import { EntityManager } from '../../services/EntityManager'
import { PlaylistsApi } from './PlaylistsApi'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { StorageNodeSelector } from '../../services/StorageNodeSelector'
import { Storage } from '../../services/Storage'

jest.mock('../../services/EntityManager')
jest.mock('../../services/DiscoveryNodeSelector')
jest.mock('../../services/StorageNodeSelector')
jest.mock('../../services/Storage')

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
  .spyOn(PlaylistsApi.prototype, 'generateId' as any)
  .mockImplementation(async () => {
    return 1
  })

jest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      txReceipt: {
        blockHash: 'a',
        blockNumber: 1
      }
    } as any
  })

describe('PlaylistsApi', () => {
  let playlists: PlaylistsApi

  const auth = new Auth()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector
  })

  beforeAll(() => {
    playlists = new PlaylistsApi(
      new Configuration(),
      new Storage({ storageNodeSelector }),
      new EntityManager(),
      auth
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('savePlaylist', () => {
    it('saves a playlist if valid metadata is provided', async () => {
      const result = await playlists.savePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.savePlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unsavePlaylist', () => {
    it('unsaves a playlist if valid metadata is provided', async () => {
      const result = await playlists.unsavePlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.unsavePlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('repostPlaylist', () => {
    it('reposts a playlist if valid metadata is provided', async () => {
      const result = await playlists.repostPlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.repostPlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unrepostPlaylist', () => {
    it('unreposts a playlist if valid metadata is provided', async () => {
      const result = await playlists.unrepostPlaylist({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await playlists.unrepostPlaylist({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
