import fs from 'fs'
import path from 'path'

import { beforeAll, expect, jest } from '@jest/globals'

import { developmentConfig } from '../../config/development'
import { DefaultAuth } from '../../services/Auth/DefaultAuth'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { EntityManager } from '../../services/EntityManager'
import { Logger } from '../../services/Logger'
import { SolanaRelay } from '../../services/Solana/SolanaRelay'
import { SolanaRelayWalletAdapter } from '../../services/Solana/SolanaRelayWalletAdapter'
import {
  ClaimableTokensClient,
  getDefaultClaimableTokensConfig
} from '../../services/Solana/programs/ClaimableTokensClient'
import {
  PaymentRouterClient,
  getDefaultPaymentRouterClientConfig
} from '../../services/Solana/programs/PaymentRouterClient'
import { SolanaClient } from '../../services/Solana/programs/SolanaClient'
import { Storage } from '../../services/Storage'
import { StorageNodeSelector } from '../../services/StorageNodeSelector'
import { Genre } from '../../types/Genre'
import { Mood } from '../../types/Mood'
import { Configuration } from '../generated/default'
import { PlaylistsApi as GeneratedPlaylistsApi } from '../generated/default/apis/PlaylistsApi'
import { TrackUploadHelper } from '../tracks/TrackUploadHelper'

import { AlbumsApi } from './AlbumsApi'

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
jest.mock('../tracks/TrackUploadHelper')
jest.mock('../tracks/TrackUploadHelper')
jest.mock('../generated/default/apis/PlaylistsApi')

jest.spyOn(Storage.prototype, 'uploadFile').mockImplementation(async () => {
  return {
    id: 'a',
    status: 'done',
    results: {
      '320': 'a'
    },
    orig_file_cid:
      'baeaaaiqsea7fukrfrjrugqts6jqfmqhcb5ruc5pjmdk3anj7amoht4d4gemvq',
    orig_filename: 'file.wav',
    probe: {
      format: {
        duration: '10'
      }
    },
    audio_analysis_error_count: 0,
    audio_analysis_results: {}
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

jest
  .spyOn(EntityManager.prototype, 'getCurrentBlock')
  .mockImplementation(async () => {
    return {
      timestamp: 1
    }
  })

jest
  .spyOn(GeneratedPlaylistsApi.prototype, 'getPlaylist')
  .mockImplementation(async () => {
    return {
      data: [
        {
          playlistName: 'test',
          playlistContents: [
            { trackId: 'yyNwXq7', timestamp: 1 },
            { trackId: 'yyNwXq7', timestamp: 1 }
          ]
        } as any
      ]
    }
  })

describe('AlbumsApi', () => {
  let albums: AlbumsApi

  const auth = new DefaultAuth()
  const logger = new Logger()
  const discoveryNodeSelector = new DiscoveryNodeSelector()
  const storageNodeSelector = new StorageNodeSelector({
    auth,
    discoveryNodeSelector,
    logger
  })

  beforeAll(() => {
    const solanaWalletAdapter = new SolanaRelayWalletAdapter({
      solanaRelay: new SolanaRelay(
        new Configuration({
          middleware: [discoveryNodeSelector.createMiddleware()]
        })
      )
    })
    const solanaClient = new SolanaClient({
      solanaWalletAdapter
    })
    albums = new AlbumsApi(
      new Configuration(),
      new Storage({ storageNodeSelector, logger: new Logger() }),
      new EntityManager({ discoveryNodeSelector: new DiscoveryNodeSelector() }),
      auth,
      logger,
      new ClaimableTokensClient({
        ...getDefaultClaimableTokensConfig(developmentConfig),
        solanaClient
      }),
      new PaymentRouterClient({
        ...getDefaultPaymentRouterClientConfig(developmentConfig),
        solanaClient
      }),
      new SolanaRelay(
        new Configuration({
          middleware: [discoveryNodeSelector.createMiddleware()]
        })
      ),
      solanaClient
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('uploadAlbum', () => {
    it('uploads an album if valid metadata is provided', async () => {
      const result = await albums.uploadAlbum({
        userId: '7eP5n',
        coverArtFile: {
          buffer: pngFile,
          name: 'coverArt'
        },
        metadata: {
          genre: Genre.ACOUSTIC,
          albumName: 'My Album',
          mood: Mood.TENDER
        },
        trackMetadatas: [
          {
            title: 'BachGavotte'
          }
        ],
        trackFiles: [
          {
            buffer: wavFile,
            name: 'trackArt'
          }
        ]
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1,
        albumId: '7eP5n'
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.uploadAlbum({
          userId: '7eP5n',
          coverArtFile: {
            buffer: pngFile,
            name: 'coverArt'
          },
          metadata: {} as any,
          trackMetadatas: [
            {
              title: 'BachGavotte'
            }
          ],
          trackFiles: [
            {
              buffer: wavFile,
              name: 'trackArt'
            }
          ]
        })
      }).rejects.toThrow()
    })
  })

  describe('updateAlbum', () => {
    it('updates an album if valid metadata is provided', async () => {
      const result = await albums.updateAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj',
        coverArtFile: {
          buffer: pngFile,
          name: 'coverArt'
        },
        metadata: {
          genre: Genre.ACOUSTIC,
          albumName: 'My Album edited',
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
        await albums.updateAlbum({
          userId: '7eP5n',
          albumId: 'x5pJ3Aj',
          coverArtFile: {
            buffer: pngFile,
            name: 'coverArt'
          },
          metadata: {
            mod: Mood.TENDER
          } as any
        })
      }).rejects.toThrow()
    })
  })

  describe('deleteAlbum', () => {
    it('deletes an album if valid metadata is provided', async () => {
      const result = await albums.deleteAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.deleteAlbum({
          userId: '7eP5n',
          albumId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('favoriteAlbum', () => {
    it('favorites an album if valid metadata is provided', async () => {
      const result = await albums.favoriteAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.favoriteAlbum({
          userId: '7eP5n',
          albumId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unfavoriteAlbum', () => {
    it('unfavorites an album if valid metadata is provided', async () => {
      const result = await albums.unfavoriteAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.unfavoriteAlbum({
          userId: '7eP5n',
          albumId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('repostAlbum', () => {
    it('reposts an album if valid metadata is provided', async () => {
      const result = await albums.repostAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.repostAlbum({
          userId: '7eP5n',
          albumId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unrepostAlbum', () => {
    it('unreposts an album if valid metadata is provided', async () => {
      const result = await albums.unrepostAlbum({
        userId: '7eP5n',
        albumId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await albums.unrepostAlbum({
          userId: '7eP5n',
          albumId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
