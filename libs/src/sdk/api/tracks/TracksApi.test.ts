import { TracksApi } from './TracksApi'
import {
  DiscoveryNodeSelector,
  Storage,
  EntityManager,
  Auth
} from '../../services'
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

  beforeAll(() => {
    tracks = new TracksApi(
      new Configuration(),
      new DiscoveryNodeSelector(),
      new Storage(),
      new EntityManager(),
      new Auth()
    )
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
        error: false,
        trackId: 1,
        transcodedTrackCID: 'a'
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
})
