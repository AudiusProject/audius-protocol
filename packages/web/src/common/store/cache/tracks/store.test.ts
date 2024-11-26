import { userTrackMetadataFromSDK } from '@audius/common/adapters'
import { Kind, StemCategory, Status } from '@audius/common/models'
import {
  cacheActions,
  cacheTracksActions as trackActions,
  cacheReducer,
  cacheTracksSelectors,
  confirmTransaction,
  initialConfirmerState,
  confirmerReducer,
  confirmerSagas
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { getContext } from 'redux-saga-test-plan/matchers'
import * as matchers from 'redux-saga-test-plan/matchers'
import { StaticProvider, throwError } from 'redux-saga-test-plan/providers'
import { describe, it, Mock, vi } from 'vitest'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { allSagas, noopReducer } from 'store/testHelper'

import trackCacheSagas from './sagas'

const sagas = () => [...trackCacheSagas(), ...confirmerSagas()]

const { asCache, initialCacheState } = cacheReducer
const { getTrack } = cacheTracksSelectors

const initialAccountState = {
  collections: {},
  orderedPlaylists: [],
  userId: 1,
  hasTracks: null,
  status: Status.IDLE,
  reason: null,
  connectivityFailure: false,
  needsAccountRecovery: false,
  walletAddresses: { currentUser: null, web3User: null }
}

const mockAudiusSdk = {
  tracks: { updateTrack: () => {} },
  full: { tracks: { getTrack: () => {} } }
} as any

const defaultProviders: StaticProvider[] = [
  [getContext('remoteConfigInstance'), remoteConfigInstance],
  [getContext('getFeatureEnabled'), () => false],
  [getContext('audiusSdk'), async () => mockAudiusSdk],
  [getContext('reportToSentry'), () => {}]
]

// Add mock at the top level
vi.mock('@audius/common/adapters', async () => ({
  userTrackMetadataFromSDK: vi.fn((data) => data),
  trackMetadataForUploadToSdk: (
    (await vi.importActual('@audius/common/adapters')) as any
  ).trackMetadataForUploadToSdk
}))

describe('editTrack', () => {
  const mockTrackId = 1
  const mockUserId = 123
  const mockTrack = {
    blocknumber: 123456,
    is_delete: false,
    track_id: mockTrackId,
    created_at: '2023-01-01T00:00:00Z',
    create_date: '2023-01-01T00:00:00Z',
    followee_reposts: [],
    followee_saves: [],
    has_current_user_reposted: false,
    has_current_user_saved: false,
    is_unlisted: false,
    is_available: true,
    is_playlist_upload: false,
    is_premium: false,
    is_scheduled_release: false,
    premium_conditions: null,
    preview_start_seconds: null,
    track_segments: [
      {
        duration: '180',
        multihash: 'QmTrackHash'
      }
    ],
    stem_of: null,
    download_count: 0,
    play_count: 0,
    save_count: 0,
    repost_count: 0,
    duration: 180,
    owner_id: mockUserId,
    release_date: '2023-01-01',
    description: 'Old description',
    genre: 'Electronic',
    mood: 'Energetic',
    tags: 'old,tags',
    title: 'Old Title',
    isrc: null,
    iswc: null,
    credits_splits: null,
    license: 'All rights reserved',
    cover_art: 'QmOldArtHash',
    cover_art_sizes: 'QmOldArtSizesHash',
    remix_of: null,
    permalink: '',
    field_visibility: {
      mood: true,
      tags: true,
      genre: true,
      share: true,
      play_count: true,
      remixes: true
    },
    is_stream_gated: false,
    stream_conditions: null,
    is_download_gated: false,
    download_conditions: null,
    is_downloadable: true,
    is_original_available: true,
    comments_disabled: false,
    ai_attribution_user_id: null,
    allowed_api_keys: null,
    bpm: null,
    is_custom_bpm: false,
    musical_key: null,
    is_custom_musical_key: false,
    audio_analysis_error_count: 0,
    access: { stream: true, download: true },
    track_cid: 'QmTrackCID',
    orig_file_cid: 'QmOrigFileCID',
    orig_filename: 'original.mp3',
    preview_cid: 'QmPreviewCID',
    audio_upload_id: 'audio123',
    activity_timestamp: '2023-01-01T00:00:00Z',
    is_owned_by_user: true,
    comment_count: 0,
    updated_at: '2023-01-01T00:00:00Z'
  }

  const mockFormFields = {
    blocknumber: 123456,
    is_delete: false,
    track_id: mockTrackId,
    created_at: '2023-01-01T00:00:00Z',
    create_date: '2023-01-01T00:00:00Z',
    followee_reposts: [],
    followee_saves: [],
    has_current_user_reposted: false,
    has_current_user_saved: false,
    is_unlisted: false,
    is_available: true,
    is_playlist_upload: false,
    is_premium: false,
    is_scheduled_release: false,
    premium_conditions: null,
    preview_start_seconds: null,
    track_segments: [
      {
        duration: '180',
        multihash: 'QmTrackHash'
      }
    ],
    stem_of: undefined,
    download_count: 0,
    play_count: 0,
    save_count: 0,
    repost_count: 0,
    duration: 180,
    owner_id: mockUserId,
    release_date: '2023-01-01',
    description: 'New description',
    genre: 'Hip-Hop',
    mood: 'Chill',
    tags: 'new,fresh,tags',
    title: 'New Title',
    isrc: null,
    iswc: null,
    credits_splits: null,
    license: 'All rights reserved' as const,
    cover_art: 'QmOldArtHash',
    cover_art_sizes: 'QmOldArtSizesHash',
    remix_of: null,
    permalink: '',
    field_visibility: {
      mood: false,
      tags: true,
      genre: true,
      share: false,
      play_count: true,
      remixes: true
    },
    is_stream_gated: false,
    stream_conditions: null,
    is_download_gated: false,
    download_conditions: null,
    is_downloadable: true,
    is_original_available: true,
    comments_disabled: false,
    ai_attribution_user_id: null,
    allowed_api_keys: null,
    bpm: null,
    is_custom_bpm: false,
    musical_key: null,
    is_custom_musical_key: false,
    audio_analysis_error_count: 0,
    access: { stream: true, download: true },
    track_cid: 'QmTrackCID',
    orig_file_cid: 'QmOrigFileCID',
    orig_filename: 'original.mp3',
    preview_cid: 'QmPreviewCID',
    audio_upload_id: 'audio123',
    activity_timestamp: '2023-01-01T00:00:00Z',
    is_owned_by_user: true,
    comment_count: 0,
    updated_at: '2023-01-01T00:00:00Z'
  }

  const mockUpdatedTrack = {
    ...mockTrack,
    ...mockFormFields
  }

  const mockTxReceipt = {
    blockHash: '0x123',
    blockNumber: 456
  }

  it('successfully edits track metadata fields', async () => {
    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [
          matchers.call.fn(mockAudiusSdk.tracks.updateTrack),
          {
            blockHash: mockTxReceipt.blockHash,
            blockNumber: mockTxReceipt.blockNumber
          }
        ],
        [matchers.call.fn(confirmTransaction), true],
        [matchers.select.selector(getTrack), mockTrack],
        [
          matchers.call.fn(mockAudiusSdk.full.tracks.getTrack),
          { data: mockUpdatedTrack }
        ]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, mockFormFields))
      .put(
        cacheActions.update(Kind.TRACKS, [
          { id: mockTrackId, metadata: mockUpdatedTrack }
        ])
      )
      .put(trackActions.editTrackSucceeded())
      .silentRun()
  })

  it('handles premium track gating updates', async () => {
    const premiumFormFields = {
      ...mockFormFields,
      is_premium: true,
      premium_conditions: {
        usdc_purchase: {
          price: 1.99,
          splits: { [mockUserId]: 100 }
        }
      }
    }

    const mockUpdatedPremiumTrack = {
      ...mockUpdatedTrack,
      ...premiumFormFields
    }

    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [
          matchers.call.fn(mockAudiusSdk.tracks.updateTrack),
          {
            blockHash: mockTxReceipt.blockHash,
            blockNumber: mockTxReceipt.blockNumber
          }
        ],
        [matchers.call.fn(confirmTransaction), true],
        [matchers.select.selector(getTrack), mockTrack],
        [
          matchers.call.fn(mockAudiusSdk.full.tracks.getTrack),
          { data: mockUpdatedPremiumTrack }
        ]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, premiumFormFields))
      .put(
        cacheActions.update(Kind.TRACKS, [
          { id: mockTrackId, metadata: mockUpdatedPremiumTrack }
        ])
      )
      .put(trackActions.editTrackSucceeded())
      .silentRun()
  })

  it('handles stem track updates', async () => {
    const stemFormFields = {
      ...mockFormFields,
      stem_of: {
        category: StemCategory.BASS,
        parent_track_id: 999
      }
    }

    const mockUpdatedStemTrack = {
      ...mockUpdatedTrack,
      ...stemFormFields
    }

    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [
          matchers.call.fn(mockAudiusSdk.tracks.updateTrack),
          {
            blockHash: mockTxReceipt.blockHash,
            blockNumber: mockTxReceipt.blockNumber
          }
        ],
        [matchers.call.fn(confirmTransaction), true],
        [matchers.select.selector(getTrack), mockTrack],
        [
          matchers.call.fn(mockAudiusSdk.full.tracks.getTrack),
          { data: mockUpdatedStemTrack }
        ]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, stemFormFields))
      .put(
        cacheActions.update(Kind.TRACKS, [
          { id: mockTrackId, metadata: mockUpdatedStemTrack }
        ])
      )
      .put(trackActions.editTrackSucceeded())
      .silentRun()
  })

  it('handles track preview updates', async () => {
    const previewFormFields = {
      ...mockFormFields,
      preview_start_seconds: 30
    }

    const mockUpdatedPreviewTrack = {
      ...mockTrack,
      preview_start_seconds: 30,
      preview_cid: 'QmNewPreviewHash'
    }

    // Mock the adapter for this specific test
    const mockUserTrackMetadataFromSDK = userTrackMetadataFromSDK as Mock
    mockUserTrackMetadataFromSDK.mockImplementation(
      () => mockUpdatedPreviewTrack
    )

    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [
          matchers.call.fn(mockAudiusSdk.tracks.updateTrack),
          {
            blockHash: mockTxReceipt.blockHash,
            blockNumber: mockTxReceipt.blockNumber
          }
        ],
        [matchers.call.fn(confirmTransaction), true],
        [matchers.select.selector(getTrack), mockTrack],
        [
          matchers.call.fn(mockAudiusSdk.full.tracks.getTrack),
          { data: mockUpdatedPreviewTrack }
        ]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, previewFormFields))
      .put(
        cacheActions.update(Kind.TRACKS, [
          { id: mockTrackId, metadata: mockUpdatedPreviewTrack }
        ])
      )
      .put(trackActions.editTrackSucceeded())
      .silentRun()
  })

  it('handles track credits and rights updates', async () => {
    const creditsFormFields = {
      ...mockFormFields,
      credits_splits: JSON.stringify({
        vocals: { [mockUserId]: 100 }
      }),
      isrc: 'USRC17607839',
      iswc: 'T-345246800-1',
      license: 'All rights reserved' as const
    }

    const mockUpdatedCreditsTrack = {
      ...mockUpdatedTrack,
      ...creditsFormFields
    }

    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [
          matchers.call.fn(mockAudiusSdk.tracks.updateTrack),
          {
            blockHash: mockTxReceipt.blockHash,
            blockNumber: mockTxReceipt.blockNumber
          }
        ],
        [matchers.call.fn(confirmTransaction), true],
        [matchers.select.selector(getTrack), mockTrack],
        [
          matchers.call.fn(mockAudiusSdk.full.tracks.getTrack),
          { data: mockUpdatedCreditsTrack }
        ]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, creditsFormFields))
      .put(
        cacheActions.update(Kind.TRACKS, [
          { id: mockTrackId, metadata: mockUpdatedCreditsTrack }
        ])
      )
      .put(trackActions.editTrackSucceeded())
      .silentRun()
  })

  it('handles invalid track metadata updates', async () => {
    const invalidFormFields = {
      ...mockFormFields,
      title: '', // Title cannot be empty
      release_date: 'invalid-date'
    }

    const error = new Error('Invalid track metadata')

    await expectSaga(allSagas(sagas()))
      .withReducer(
        combineReducers({
          tracks: asCache(noopReducer(), Kind.TRACKS),
          confirmer: confirmerReducer,
          backend: noopReducer(),
          reachability: noopReducer(),
          account: (state = initialAccountState) => state
        }),
        {
          tracks: {
            ...initialCacheState,
            entries: {
              [mockTrackId]: { metadata: mockTrack }
            }
          },
          confirmer: initialConfirmerState,
          backend: { isSetup: true },
          reachability: { networkReachable: true },
          account: {
            ...initialAccountState,
            status: Status.SUCCESS
          }
        }
      )
      .provide([
        ...defaultProviders,
        [matchers.select.selector(getTrack), mockTrack],
        [matchers.call.fn(mockAudiusSdk.tracks.updateTrack), throwError(error)]
      ])
      .dispatch(trackActions.editTrack(mockTrackId, invalidFormFields))
      .put(trackActions.editTrackFailed())
      .silentRun()
  })
})
