import fs from 'fs'
import path from 'path'

import { beforeAll, expect, jest } from '@jest/globals'

import { DefaultAuth } from '../../services/Auth/DefaultAuth'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { EntityManager } from '../../services/EntityManager'
import { Logger } from '../../services/Logger'
import { Storage } from '../../services/Storage'
import { StorageNodeSelector } from '../../services/StorageNodeSelector'
import { Genre } from '../../types/Genre'
import { Mood } from '../../types/Mood'
import { Configuration } from '../generated/default'

import { TrackUploadHelper } from './TrackUploadHelper'
import { TracksApi } from './TracksApi'

const wavFile = fs.readFileSync(
  path.resolve(__dirname, '../../test/wav-file.wav')
)
const pngFile = fs.readFileSync(
  path.resolve(__dirname, '../../test/png-file.png')
)

jest.mock('../../services/EntityManager')
jest.mock('../../services/DiscoveryNodeSelector')
jest.mock('../../services/StorageNodeSelector')
jest.mock('../../services/Storage')
jest.mock('./TrackUploadHelper')

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
  .spyOn(TrackUploadHelper.prototype, 'generateId' as any)
  .mockImplementation(async () => {
    return 1
  })

jest
  .spyOn(
    TrackUploadHelper.prototype,
    'populateTrackMetadataWithUploadResponse' as any
  )
  .mockImplementation(async () => ({}))

jest
  .spyOn(TrackUploadHelper.prototype, 'transformTrackUploadMetadata' as any)
  .mockImplementation(async () => ({}))

jest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      blockHash: 'a',
      blockNumber: 1
    } as any
  })

describe('TracksApi', () => {
  let tracks: TracksApi

  const auth = new DefaultAuth()
  const logger = new Logger()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector,
    logger
  })

  beforeAll(() => {
    tracks = new TracksApi(
      new Configuration(),
      new DiscoveryNodeSelector(),
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

  describe('uploadTrack', () => {
    it('uploads a track if valid metadata is provided', async () => {
      const result = await tracks.uploadTrack({
        userId: '7eP5n',
        coverArtFile: {
          buffer: pngFile,
          name: 'coverArt'
        },
        metadata: {
          title: 'BachGavotte',
          genre: Genre.ELECTRONIC,
          mood: Mood.TENDER
        },
        trackFile: {
          buffer: wavFile,
          name: 'trackArt'
        }
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1,
        trackId: '7eP5n'
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await tracks.uploadTrack({
          userId: '7eP5n',
          coverArtFile: {
            buffer: pngFile,
            name: 'coverArt'
          },
          metadata: {
            title: 'BachGavotte'
          } as any,
          trackFile: {
            buffer: wavFile,
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
          buffer: pngFile,
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
            buffer: pngFile,
            name: 'coverArt'
          },
          metadata: {
            titl: 'BachGavotte'
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

  describe('favoriteTrack', () => {
    it('favorites a track if valid metadata is provided', async () => {
      const result = await tracks.favoriteTrack({
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
        await tracks.favoriteTrack({
          userId: '7eP5n',
          trackId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unfavoriteTrack', () => {
    it('unfavorites a track if valid metadata is provided', async () => {
      const result = await tracks.unfavoriteTrack({
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
        await tracks.unfavoriteTrack({
          userId: '7eP5n',
          trackId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('repostTrack', () => {
    it('reposts a track if valid metadata is provided', async () => {
      const result = await tracks.repostTrack({
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
        await tracks.repostTrack({
          userId: '7eP5n',
          trackId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unrepostTrack', () => {
    it('unreposts a track if valid metadata is provided', async () => {
      const result = await tracks.unrepostTrack({
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
        await tracks.unrepostTrack({
          userId: '7eP5n',
          trackId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
