import { TracksApi } from './TracksApi'
import {
  DiscoveryNodeSelector,
  EntityManager,
  StorageNodeSelector,
  Storage
} from '../../services'
import { Auth } from '../../services/Auth/Auth'
import { beforeAll, expect, jest } from '@jest/globals'
import { Configuration } from '../generated/default'
import { Genre } from '../../types/Genre'
import { Mood } from '../../types/Mood'

jest.mock('../../services')

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
  .spyOn(TracksApi.prototype, 'generateTrackId' as any)
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

describe('TracksApi', () => {
  let tracks: TracksApi

  const auth = new Auth()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector
  })

  beforeAll(() => {
    tracks = new TracksApi(
      new Configuration(),
      new DiscoveryNodeSelector(),
      new Storage({ storageNodeSelector }),
      new EntityManager(),
      auth
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('uploadTrack', () => {
    it('uploads a track if valid metadata is provided', async () => {
      const result = await tracks.uploadTrack({
        userId: '7eP5n',
        coverArtFile: {
          buffer: Buffer.from([]),
          name: 'coverArt'
        },
        metadata: {
          title: 'BachGavotte',
          genre: Genre.ELECTRONIC,
          mood: Mood.TENDER
        },
        trackFile: {
          buffer: Buffer.from([]),
          name: 'trackArt'
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1,
        trackId: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await tracks.uploadTrack({
          userId: '7eP5n',
          coverArtFile: {
            buffer: Buffer.from([]),
            name: 'coverArt'
          },
          metadata: {
            title: 'BachGavotte'
          } as any,
          trackFile: {
            buffer: Buffer.from([]),
            name: 'trackArt'
          }
        })
      }).rejects.toThrow()
    })
  })

  describe('updateTrack', () => {
    it('updates a track if valid metadata is provided', async () => {
      const result = await tracks.updateTrack({
        userId: '7eP5n',
        trackId: 'ogRRByg',
        coverArtFile: {
          buffer: Buffer.from([]),
          name: 'coverArt'
        },
        metadata: {
          title: 'BachGavotte',
          genre: Genre.ELECTRONIC,
          mood: Mood.TENDER
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await tracks.updateTrack({
          userId: '7eP5n',
          trackId: 'ogRRByg',
          coverArtFile: {
            buffer: Buffer.from([]),
            name: 'coverArt'
          },
          metadata: {
            title: 'BachGavotte'
          } as any
        })
      }).rejects.toThrow()
    })
  })

  describe('deleteTrack', () => {
    it('deletes a track if valid metadata is provided', async () => {
      const result = await tracks.deleteTrack({
        userId: '7eP5n',
        trackId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await tracks.deleteTrack({
          userId: '7eP5n',
          trackId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
