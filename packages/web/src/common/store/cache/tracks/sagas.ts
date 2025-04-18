import {
  userTrackMetadataFromSDK,
  trackMetadataForUploadToSdk,
  fileToSdk
} from '@audius/common/adapters'
import { queryTrack, queryUser } from '@audius/common/api'
import {
  Name,
  Kind,
  Track,
  Collection,
  ID,
  Remix,
  StemUploadWithFile
} from '@audius/common/models'
import {
  Entry,
  getContext,
  accountSelectors,
  cacheTracksActions as trackActions,
  cacheActions,
  confirmerActions,
  TrackMetadataForUpload,
  stemsUploadActions,
  stemsUploadSelectors,
  getSDK
} from '@audius/common/store'
import {
  formatMusicalKey,
  makeKindId,
  squashNewLines,
  uuid,
  waitForAccount
} from '@audius/common/utils'
import { Id, OptionalId } from '@audius/sdk'
import { call, fork, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { addPremiumMetadata } from 'common/store/upload/sagaHelpers'
import { waitForWrite } from 'utils/sagaHelpers'

import { recordEditTrackAnalytics } from './sagaHelpers'

const { startStemUploads } = stemsUploadActions
const { getCurrentUploads } = stemsUploadSelectors
const { getUserId, getUserHandle } = accountSelectors

function* fetchRepostInfo(entries: Entry<Collection>[]) {
  const userIds: ID[] = []
  entries.forEach((entry) => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach((repost) =>
        userIds.push(repost.user_id)
      )
    }
  })

  if (userIds.length) {
    yield* call(fetchUsers, userIds)
  }
}

function* watchAdd() {
  yield* takeEvery(
    cacheActions.ADD_SUCCEEDED,
    function* (action: ReturnType<typeof cacheActions.addSucceeded>) {
      // This code only applies to tracks
      if (action.kind !== Kind.TRACKS) return

      // Fetch repost data
      const isNativeMobile = yield* getContext('isNativeMobile')
      if (!isNativeMobile) {
        yield* fork(fetchRepostInfo, action.entries as Entry<Collection>[])
      }
    }
  )
}

type TrackWithRemix = Pick<Track, 'track_id' | 'title'> & {
  remix_of: { tracks: Pick<Remix, 'parent_track_id'>[] } | null
}

export function* trackNewRemixEvent(track: TrackWithRemix) {
  yield* waitForAccount()
  const accountHandle = yield* select(getUserHandle)
  if (!track.remix_of || !accountHandle) return
  const remixParentTrack = track.remix_of.tracks[0]
  const parentTrack = yield* queryTrack(remixParentTrack.parent_track_id)
  const parentTrackUser = parentTrack
    ? yield* queryUser(parentTrack.owner_id)
    : null
  yield* put(
    make(Name.REMIX_NEW_REMIX, {
      id: track.track_id,
      handle: accountHandle,
      title: track.title,
      parent_track_id: remixParentTrack.parent_track_id,
      parent_track_title: parentTrack ? parentTrack.title : '',
      parent_track_user_handle: parentTrackUser ? parentTrackUser.handle : ''
    })
  )
}

function* editTrackAsync(action: ReturnType<typeof trackActions.editTrack>) {
  yield* call(waitForWrite)
  action.formFields.description = squashNewLines(action.formFields.description)

  const currentTrack = yield* queryTrack(action.trackId)
  if (!currentTrack) return
  const isPublishing = currentTrack._is_publishing
  const wasUnlisted = currentTrack.is_unlisted
  const isNowListed = !action.formFields.is_unlisted

  if (!isPublishing && wasUnlisted && isNowListed) {
    yield* put(
      cacheActions.update(Kind.TRACKS, [
        {
          id: action.trackId,
          metadata: { _is_publishing: true }
        }
      ])
    )
  }

  const trackForEdit = yield* addPremiumMetadata(action.formFields)

  // Format musical key
  trackForEdit.musical_key =
    formatMusicalKey(trackForEdit.musical_key || undefined) ?? null

  // Format bpm
  trackForEdit.bpm = trackForEdit.bpm ? Number(trackForEdit.bpm) : null
  trackForEdit.is_custom_bpm =
    currentTrack.is_custom_bpm ||
    (!!trackForEdit.bpm && trackForEdit.bpm !== currentTrack.bpm)
  trackForEdit.is_custom_musical_key =
    currentTrack.is_custom_musical_key ||
    (!!trackForEdit.musical_key &&
      trackForEdit.musical_key !== currentTrack.musical_key)

  yield* call(
    confirmEditTrack,
    action.trackId,
    trackForEdit,
    wasUnlisted,
    isNowListed,
    currentTrack
  )

  const track = { ...trackForEdit } as Track & TrackMetadataForUpload
  track.track_id = action.trackId

  if (track.stems) {
    const inProgressStemUploads = yield* select(
      getCurrentUploads,
      track.track_id
    )
    const existingStems = currentTrack._stems || []

    // upload net new stems
    const addedStems = track.stems.filter((stem) => {
      return !existingStems.find((existingStem) => {
        return existingStem.track_id === stem.metadata.track_id
      })
    })

    const addedStemsWithFiles = addedStems.filter(
      (stem) => 'file' in stem
    ) as StemUploadWithFile[]

    if (addedStemsWithFiles.length > 0) {
      yield* put(
        startStemUploads({
          parentId: track.track_id,
          uploads: addedStemsWithFiles,
          batchUID: uuid()
        })
      )
    }

    // delete removed stems
    const removedStems = existingStems
      .filter((existingStem) => {
        return !track.stems?.find(
          (stem) => stem.metadata.track_id === existingStem.track_id
        )
      })
      .filter((existingStem) => {
        return !inProgressStemUploads.find(
          (upload) => upload.metadata.track_id === existingStem.track_id
        )
      })

    for (const stem of removedStems) {
      yield* put(trackActions.deleteTrack(stem.track_id))
    }
  }

  yield* put(
    cacheActions.update(Kind.TRACKS, [{ id: track.track_id, metadata: track }])
  )
  yield* put(trackActions.editTrackSucceeded())

  // This is a new remix
  if (
    track?.remix_of?.tracks?.[0]?.parent_track_id &&
    currentTrack?.remix_of?.tracks?.[0]?.parent_track_id !==
      track?.remix_of?.tracks?.[0]?.parent_track_id
  ) {
    // This is a new remix
    yield* call(trackNewRemixEvent, track)
  }
}

function* confirmEditTrack(
  trackId: ID,
  formFields: TrackMetadataForUpload,
  wasUnlisted: boolean,
  isNowListed: boolean,
  currentTrack: Track
) {
  yield* waitForWrite()
  const sdk = yield* getSDK()
  const generatePreview =
    (formFields.preview_start_seconds !== null &&
      formFields.preview_start_seconds !== undefined &&
      currentTrack.preview_start_seconds !==
        formFields.preview_start_seconds) ||
    currentTrack.track_cid !== formFields.track_cid

  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        yield* waitForAccount()
        // Need to poll with the new track name in case it changed
        const userId = yield* select(getUserId)
        if (!userId) {
          throw new Error('No userId set, cannot edit track')
        }

        if (!userId) return
        const coverArtFile =
          formFields.artwork && 'file' in formFields.artwork
            ? formFields.artwork.file
            : undefined

        yield* call([sdk.tracks, sdk.tracks.updateTrack], {
          userId: Id.parse(userId),
          trackId: Id.parse(trackId),
          coverArtFile: coverArtFile
            ? fileToSdk(coverArtFile, 'cover_art')
            : undefined,
          metadata: trackMetadataForUploadToSdk(formFields),
          generatePreview
        })

        const { data } = yield* call(
          [sdk.full.tracks, sdk.full.tracks.getTrack],
          { trackId: Id.parse(trackId), userId: OptionalId.parse(userId) }
        )
        return data ? userTrackMetadataFromSDK(data) : null
      },
      function* (confirmedTrack: TrackMetadataForUpload & Track) {
        if (wasUnlisted && isNowListed) {
          confirmedTrack._is_publishing = false
        }

        yield* put(
          cacheActions.update(Kind.TRACKS, [
            {
              id: confirmedTrack.track_id,
              metadata: confirmedTrack
            }
          ])
        )
        yield* call(recordEditTrackAnalytics, currentTrack, confirmedTrack)
      },
      function* ({ error, message, timeout }) {
        const reportToSentry = yield* getContext('reportToSentry')
        reportToSentry({
          error,
          additionalInfo: { message, timeout, trackId, formFields },
          name: 'Edit Track'
        })
        yield* put(trackActions.editTrackFailed())
      }
    )
  )
}

function* watchEditTrack() {
  yield* takeEvery(trackActions.EDIT_TRACK, editTrackAsync)
}

const sagas = () => {
  return [watchAdd, watchEditTrack]
}

export default sagas
