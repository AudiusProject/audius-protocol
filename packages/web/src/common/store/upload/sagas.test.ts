import { Feature, Name, StemUploadWithFile } from '@audius/common/models'
import {
  TrackForUpload,
  TrackMetadataForUpload,
  UploadType,
  accountSelectors,
  confirmTransaction,
  uploadActions
} from '@audius/common/store'
import { waitForAccount } from '@audius/common/utils'
import { EntityManagerAction } from '@audius/sdk'
import camelcaseKeys from 'camelcase-keys'
import { expectSaga, testSaga } from 'redux-saga-test-plan'
import { call, getContext, select } from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import { all, fork } from 'typed-redux-saga'
import { beforeAll, describe, expect, it, vitest } from 'vitest'

import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite } from 'utils/sagaHelpers'

import { make } from '../analytics/actions'
import { retrieveTracks } from '../cache/tracks/utils'

import { addPremiumMetadata } from './sagaHelpers'
import uploadSagas, {
  deleteTracks,
  handleUploads,
  uploadCollection,
  uploadMultipleTracks
} from './sagas'

function* saga() {
  yield* all(uploadSagas().map(fork))
}

const emptyMetadata: TrackMetadataForUpload = {
  artwork: null,
  blocknumber: 0,
  is_delete: false,
  track_id: 0,
  created_at: '',
  create_date: null,
  isrc: null,
  iswc: null,
  credits_splits: null,
  description: null,
  followee_reposts: [],
  followee_saves: [],
  genre: '',
  has_current_user_reposted: false,
  has_current_user_saved: false,
  license: null,
  mood: null,
  play_count: 0,
  owner_id: 0,
  release_date: null,
  repost_count: 0,
  save_count: 0,
  comment_count: 0,
  tags: null,
  title: '',
  track_segments: [],
  cover_art: null,
  cover_art_sizes: null,
  is_scheduled_release: false,
  is_unlisted: false,
  is_available: false,
  is_stream_gated: false,
  stream_conditions: null,
  is_download_gated: false,
  download_conditions: null,
  access: {
    stream: false,
    download: false
  },
  permalink: '',
  track_cid: null,
  orig_file_cid: null,
  orig_filename: null,
  is_downloadable: false,
  is_original_available: false,
  remix_of: null,
  duration: 0,
  updated_at: '',
  is_owned_by_user: false,
  cover_original_song_title: null,
  cover_original_artist: null
}

describe('upload', () => {
  beforeAll(() => {
    vitest.spyOn(global.console, 'debug').mockImplementation(() => {})
  })

  it('uploads single track as non-collection', () => {
    const testTrack: TrackForUpload = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: emptyMetadata
    }
    return (
      expectSaga(saga)
        .dispatch(
          uploadActions.uploadTracks({
            uploadType: UploadType.INDIVIDUAL_TRACK,
            tracks: [testTrack]
          })
        )
        .provide([
          [call.fn(waitForWrite), undefined],
          [select(accountSelectors.getAccountUser), {}],
          [select(accountSelectors.getUserId), 12345],
          [call.fn(uploadMultipleTracks), undefined],
          [call.fn(addPremiumMetadata), testTrack]
        ])
        // Assertions
        // Assert that we format the tracks for premium conditions
        .call.like({ fn: addPremiumMetadata })
        // Ensure that we call uploadMultipleTracks
        .call.like({ fn: uploadMultipleTracks, args: [[testTrack]] })
        // Ensure that this isn't treated as a collection
        .not.call.like({ fn: uploadCollection })
        .run()
    )
  })

  it('uploads stems with track', () => {
    const stemMetadata: TrackMetadataForUpload = emptyMetadata
    const stem: StemUploadWithFile = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: stemMetadata,
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    }
    const testTrack: TrackForUpload = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: {
        ...emptyMetadata,
        stems: [stem]
      }
    }

    let i = 1
    return (
      expectSaga(saga)
        .dispatch(
          uploadActions.uploadTracks({
            uploadType: UploadType.INDIVIDUAL_TRACK,
            tracks: [testTrack]
          })
        )
        .provide([
          [call.fn(waitForWrite), undefined],
          [select(accountSelectors.getAccountUser), {}],
          [select(accountSelectors.getUserId), 12345],
          [call.fn(addPremiumMetadata), testTrack.metadata],
          [
            getContext('audiusSdk'),
            () => {
              return {
                tracks: {
                  generateTrackId: () => i++,
                  uploadTrackFiles: () => testTrack.metadata,
                  writeTrackToChain: () => ({
                    trackId: '7eP5n'
                  })
                }
              }
            }
          ],
          [call.fn(confirmTransaction), true],
          [call.fn(waitForAccount), undefined],
          [call.fn(retrieveTracks), [testTrack.metadata]]
        ])
        // Assertions
        // Uploaded track
        .put.like({
          action: {
            type: 'UPLOADED',
            payload: { trackIndex: 0, stemIndex: null }
          }
        })
        // Uploaded stem
        .put.like({
          action: {
            type: 'UPLOADED',
            payload: { trackIndex: 0, stemIndex: 0 }
          }
        })
        // Published stem
        .put.like({
          action: {
            type: 'PUBLISHED',
            payload: { trackIndex: 0, stemIndex: 0 }
          }
        })
        // Published track
        .put.like({
          action: {
            type: 'PUBLISHED',
            payload: { trackIndex: 0, stemIndex: null }
          }
        })
        // Succeeds upload
        .put.actionType(uploadActions.UPLOAD_TRACKS_SUCCEEDED)
        .silentRun()
    )
  })

  it('does not upload parent if stem fails and deletes orphaned stems', () => {
    const stem1: StemUploadWithFile = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test stem1'),
      metadata: { ...emptyMetadata, track_id: 2, title: 'stem1' },
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    }
    const stem2: StemUploadWithFile = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test stem2'),
      metadata: { ...emptyMetadata, track_id: 3, title: 'stem2' },
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    }
    const testTrack: TrackForUpload = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: {
        ...emptyMetadata,
        track_id: 1,
        title: 'parent',
        stems: [stem1, stem2]
      }
    }
    const mockError = new Error('Publish failed')

    const mockWriteTrackUploadToChain = vitest.fn()
    // Mock successful first stem publish
    mockWriteTrackUploadToChain.mockReturnValueOnce({
      trackId: 'ML51L'
    })
    // Mock failure for second stem
    mockWriteTrackUploadToChain.mockRejectedValueOnce(mockError)

    // Mock successful uploads
    const mockUploadTrackFiles = vitest.fn()
    mockUploadTrackFiles.mockReturnValueOnce(camelcaseKeys(testTrack.metadata))
    mockUploadTrackFiles.mockReturnValueOnce(camelcaseKeys(stem1.metadata))
    mockUploadTrackFiles.mockReturnValueOnce(camelcaseKeys(stem2.metadata))

    return (
      expectSaga(handleUploads, { tracks: [testTrack], kind: 'tracks' })
        .provide([
          [call.fn(waitForWrite), undefined],
          [select(accountSelectors.getAccountUser), {}],
          [select(accountSelectors.getUserId), 12345],
          [call.fn(addPremiumMetadata), testTrack.metadata],
          [
            getContext('audiusSdk'),
            () => {
              return {
                tracks: {
                  uploadTrackFiles: mockUploadTrackFiles,
                  writeTrackToChain: mockWriteTrackUploadToChain
                }
              }
            }
          ],
          [call.fn(confirmTransaction), true],
          [call.fn(waitForAccount), undefined],
          [call.fn(retrieveTracks), [testTrack.metadata]],
          [call.fn(deleteTracks), undefined]
        ])
        // Reports to sentry
        .call(reportToSentry, {
          name: 'UploadWorker',
          error: mockError,
          additionalInfo: {
            trackId: 3,
            metadata: stem2.metadata,
            fileSize: stem2.file.size,
            trackIndex: 0,
            stemIndex: 1,
            trackCount: 1,
            stemCount: 2,
            phase: 'publish',
            kind: 'tracks'
          },
          feature: Feature.Upload
        })
        // Fails the parent too
        .call.like({
          fn: reportToSentry,
          args: [
            {
              name: 'UploadWorker',
              additionalInfo: {
                trackId: 1,
                metadata: testTrack.metadata,
                fileSize: testTrack.file.size,
                trackIndex: 0,
                stemIndex: null,
                trackCount: 1,
                stemCount: 2,
                phase: 'publish',
                kind: 'tracks'
              },
              feature: Feature.Upload
            }
          ]
        })
        // Delete the stem that was successfully published
        .call(deleteTracks, [2])
        // Expect the saga to throw since no tracks succeeded
        .throws(Error)
        .run()
        .then(() => {
          // Never published the parent track
          expect(mockWriteTrackUploadToChain).not.toBeCalledWith(
            testTrack.metadata,
            EntityManagerAction.CREATE,
            1
          )
        })
    )
  })

  it.skip('waits for stems to upload before publishing parent', () => {
    const stem: StemUploadWithFile = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test stem'),
      metadata: { ...emptyMetadata, track_id: 2, title: 'stem' },
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    }
    const testTrack: TrackForUpload = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: {
        ...emptyMetadata,
        track_id: 1,
        title: 'parent',
        stems: [stem]
      }
    }
    const mockUploadChannel = {
      take: vitest.fn(),
      close: vitest.fn(),
      put: vitest.fn()
    }
    const mockPublishChannel = {
      take: vitest.fn(),
      close: vitest.fn(),
      put: vitest.fn()
    }
    const mockResponseChannel = { take: vitest.fn(), close: vitest.fn() }
    const mockProgressChannel = {
      take: vitest.fn(),
      close: vitest.fn()
    }
    const mockWorker = {
      cancel: vitest.fn()
    }

    // Use testSaga so we can control the order of events
    const test = testSaga(handleUploads, {
      tracks: [testTrack],
      kind: 'tracks'
    })
      .next()
      // Upload Queue
      .next(mockUploadChannel)
      // Publish Queue
      .next(mockPublishChannel)
      // Response channel
      .next(mockResponseChannel)
      // Progress channel
      .next(mockProgressChannel)
      // ActionChannelDispatcher
      .next()
      // Analytics request track upload
      .next()
      // Upload workers x2
      .next(mockWorker)
      .next(mockWorker)
      // Publish workers x2
      .next(mockWorker)
      .next(mockWorker)
      // Response channel take
      .take(mockResponseChannel)
      .next({
        type: 'UPLOADED',
        payload: {
          trackIndex: 0,
          stemIndex: null,
          metadata: camelcaseKeys(testTrack.metadata)
        }
      })
    // Don't publish parent until stems are uploaded
    expect(mockPublishChannel.put).not.toBeCalled()
    test.take(mockResponseChannel).next({
      type: 'UPLOADED',
      payload: {
        trackIndex: 0,
        stemIndex: 0,
        metadata: camelcaseKeys(stem.metadata)
      }
    })
    // Publish stem right away
    expect(mockPublishChannel.put).toBeCalledTimes(1)
    test
      .take(mockResponseChannel)
      .next({
        type: 'PUBLISHED',
        payload: {
          trackIndex: 0,
          stemIndex: 0,
          trackId: 2,
          metadata: camelcaseKeys(stem.metadata)
        }
      })
      // Mark progress as complete
      .next()
      .next()
      // Report analytics stem upload success
      .next()
    // Publish parent after final stem uploaded
    expect(mockPublishChannel.put).toBeCalledTimes(2)
    test
      .take(mockResponseChannel)
      .next({
        type: 'PUBLISHED',
        payload: {
          trackIndex: 0,
          stemIndex: null,
          trackId: 2,
          metadata: camelcaseKeys(stem.metadata)
        }
      })
      // Mark progress as complete
      .next()
      .next()
      // Report analytics stem upload success
      .next()
      // Close progress channel
      .next()
      // Close progress dispatcher
      .next()
      // Success
      .put(
        make(Name.TRACK_UPLOAD_COMPLETE_UPLOAD, {
          kind: 'tracks',
          trackCount: 1
        })
      )
  })

  it.skip('uploads parent immediately if stems are already uploaded', () => {
    const stem: StemUploadWithFile = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test stem'),
      metadata: { ...emptyMetadata, track_id: 2, title: 'stem' },
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    }
    const testTrack: TrackForUpload = {
      file: new File(['abcdefghijklmnopqrstuvwxyz'], 'test'),
      metadata: {
        ...emptyMetadata,
        track_id: 1,
        title: 'parent',
        stems: [stem]
      }
    }
    const mockUploadChannel = {
      take: vitest.fn(),
      close: vitest.fn(),
      put: vitest.fn()
    }
    const mockPublishChannel = {
      take: vitest.fn(),
      close: vitest.fn(),
      put: vitest.fn()
    }
    const mockResponseChannel = { take: vitest.fn(), close: vitest.fn() }
    const mockProgressChannel = {
      take: vitest.fn(),
      close: vitest.fn()
    }
    const mockWorker = {
      cancel: vitest.fn()
    }

    // Use testSaga so we can control the order of events
    const test = testSaga(handleUploads, {
      tracks: [testTrack],
      kind: 'tracks'
    })
      .next()
      // Upload Queue
      .next(mockUploadChannel)
      // Publish Queue
      .next(mockPublishChannel)
      // Response channel
      .next(mockResponseChannel)
      // Progress channel
      .next(mockProgressChannel)
      // ActionChannelDispatcher
      .next()
      // Analytics request track upload
      .next()
      // Upload workers x2
      .next(mockWorker)
      .next(mockWorker)
      // Publish workers x2
      .next(mockWorker)
      .next(mockWorker)
      // Response channel take
      .take(mockResponseChannel)
      .next({
        type: 'UPLOADED',
        payload: {
          trackIndex: 0,
          stemIndex: 0,
          metadata: stem.metadata
        }
      })
    // Publish stem immediately
    expect(mockPublishChannel.put).toBeCalled()
    test
      .take(mockResponseChannel)
      .next({
        type: 'PUBLISHED',
        payload: {
          trackIndex: 0,
          stemIndex: 0,
          trackId: 2,
          metadata: stem.metadata
        }
      })
      // Mark progress as complete
      .next()
      .next()
      // Report analytics stem upload success
      .next()
      // Finish upload task of parent track
      .take(mockResponseChannel)
      .next({
        type: 'UPLOADED',
        payload: {
          trackIndex: 0,
          stemIndex: null,
          metadata: testTrack.metadata
        }
      })
    // Publish parent right away since stem is published
    expect(mockPublishChannel.put).toBeCalledTimes(2)
    test
      .take(mockResponseChannel)
      .next({
        type: 'PUBLISHED',
        payload: {
          trackIndex: 0,
          stemIndex: null,
          trackId: 2,
          metadata: testTrack.metadata
        }
      })
      // Mark progress as complete
      .next()
      .next()
      // Report analytics stem upload success
      .next()
    // Publish parent after final stem uploaded
    expect(mockPublishChannel.put).toBeCalledTimes(2)
    test
      // Close progress channel
      .next()
      // Close progress dispatcher
      .next()
      // Success
      .put(
        make(Name.TRACK_UPLOAD_COMPLETE_UPLOAD, {
          kind: 'tracks',
          trackCount: 1
        })
      )
  })

  it.skip('can queue 99 uploads', () => {
    const makeStem = (name: string): StemUploadWithFile => ({
      file: new File(['abcdefghijklmnopqrstuvwxyz'], `${name}.mp3`),
      metadata: { ...emptyMetadata, title: name },
      category: null,
      allowDelete: false,
      allowCategorySwitch: false
    })
    const makeTrack = (
      name: string,
      stems: StemUploadWithFile[]
    ): TrackForUpload => ({
      file: new File(['abcdefghijklmnopqrstuvwxyz'], `${name}.mp3`),
      metadata: {
        ...emptyMetadata,
        title: name,
        stems
      }
    })
    const makeStems = (parentName: string, count: number) => {
      const res = []
      for (let i = 0; i < count; i++) {
        res.push(makeStem(`${parentName}s${i}`))
      }
      return res
    }

    const tracks = [
      makeTrack('p1', makeStems('p1', 10)),
      makeTrack('p2', makeStems('p2', 10)),
      makeTrack('p3', makeStems('p3', 10)),
      makeTrack('p4', makeStems('p4', 10)),
      makeTrack('p5', makeStems('p5', 10)),
      makeTrack('p6', makeStems('p6', 10)),
      makeTrack('p7', makeStems('p7', 10)),
      makeTrack('p8', makeStems('p8', 10)),
      makeTrack('p9', makeStems('p9', 10))
    ]

    let trackId = 0
    const sdkMock = {
      tracks: {
        generateTrackId: vitest.fn().mockImplementation(() => ++trackId),
        uploadTrack: vitest
          .fn()
          .mockImplementation((_audio, _art, metadata) => metadata),
        writeTrackToChain: vitest.fn().mockImplementation((metadata) => ({
          trackId: metadata.track_id
        }))
      }
    }

    return (
      expectSaga(saga)
        .dispatch(
          uploadActions.uploadTracks({
            uploadType: UploadType.INDIVIDUAL_TRACK,
            tracks
          })
        )
        .provide([
          [call.fn(waitForWrite), undefined],
          [select(accountSelectors.getAccountUser), {}],
          [select(accountSelectors.getUserId), 12345],
          [getContext('audiusSdk'), () => sdkMock],
          [call.fn(confirmTransaction), true],
          [call.fn(waitForAccount), undefined],
          [
            call.fn(addPremiumMetadata),
            dynamic((effect, next) => effect.args[0])
          ],
          [call.fn(retrieveTracks), tracks.map((t) => t.metadata)]
        ])
        // Assertions
        // Succeeds upload
        .put.actionType(uploadActions.UPLOAD_TRACKS_SUCCEEDED)
        .run({ timeout: 20 * 1000 })
        .then(() => {
          expect(sdkMock.tracks.uploadTrack).toHaveBeenCalledTimes(99)
        })
    )
  })
})
