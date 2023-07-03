import { Auth } from '../../services/Auth/Auth'
import { beforeAll, expect, jest } from '@jest/globals'
import { Configuration } from '../generated/default'
import { EntityManager } from '../../services/EntityManager'
import { PlaylistsApi } from './PlaylistsApi'

jest.mock('../../services/EntityManager')

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

  beforeAll(() => {
    playlists = new PlaylistsApi(new Configuration(), new EntityManager(), auth)
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
