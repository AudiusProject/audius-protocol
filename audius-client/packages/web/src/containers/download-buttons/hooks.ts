import { useCallback } from 'react'

import moment from 'moment'
import { useSelector, shallowEqual, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { ID } from 'common/models/Identifiers'
import { stemCategoryFriendlyNames, StemCategory } from 'common/models/Stems'
import { Track, StemTrack } from 'common/models/Track'
import { getHasAccount } from 'common/store/account/selectors'
import { getTrack, getTracks } from 'common/store/cache/tracks/selectors'
import {
  openSignOn,
  updateRouteOnExit,
  updateRouteOnCompletion,
  showRequiresAccountModal
} from 'containers/sign-on/store/actions'
import { getCurrentUploads } from 'store/application/ui/stemsUpload/selectors'
import { AppState } from 'store/types'

import {
  ButtonState,
  messages,
  DownloadButtonProps,
  ButtonType
} from './DownloadButtons'

const doesRequireFollow = (
  isOwner: boolean,
  following: boolean,
  track: Track
) => !isOwner && !following && track.download?.requires_follow

const useCurrentStems = (trackId: ID) => {
  const track: Track | null = useSelector(
    (state: AppState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const stemIds = (track?._stems ?? []).map(s => s.track_id)
  const stemTracksMap = useSelector(
    (state: AppState) => getTracks(state, { ids: stemIds }),
    shallowEqual
  ) as { [id: number]: StemTrack }

  // Sort the stems, filter deletes
  const stemTracks = Object.values(stemTracksMap)
    .filter(t => !t._marked_deleted && !t.is_delete)
    .sort(
      (a, b) =>
        moment(a.created_at).milliseconds() -
        moment(b.created_at).milliseconds()
    )
    .map(t => ({
      downloadURL: t.download?.cid,
      category: t.stem_of.category,
      downloadable: true,
      id: t.track_id
    }))
    .filter(t => t.downloadURL)
  return { stemTracks, track }
}

const useUploadingStems = (trackId: ID) => {
  const currentUploads = useSelector(
    (state: AppState) => getCurrentUploads(state, trackId),
    shallowEqual
  )
  const uploadingTracks = currentUploads.map(u => ({
    category: u.category,
    downloadable: false
  }))
  return { uploadingTracks }
}

const getFriendlyNames = (
  stems: Array<{
    category: StemCategory
    downloadable: boolean
    downloadURL?: string
    id?: ID
  }>
) => {
  // Make a map of counts of the shape { category: { count, index }}
  // where count is the number of occurences of a category, and index
  // tracks which instance you're pointing at when naming.
  const catCounts = stems.reduce((acc, cur) => {
    const { category } = cur
    if (!acc[category]) {
      acc[category] = { count: 0, index: 0 }
    }
    acc[category].count += 1
    return acc
  }, {} as { [category: string]: { count: number; index: number } })

  const combinedFriendly = stems.map(t => {
    const friendlyName = stemCategoryFriendlyNames[t.category]
    let label
    const counts = catCounts[t.category]
    if (counts.count <= 1) {
      label = messages.getDownloadStem(friendlyName, 0)
    } else {
      counts.index += 1
      label = messages.getDownloadStem(friendlyName, counts.index)
    }

    return {
      downloadURL: t.downloadURL,
      downloadable: t.downloadable,
      label,
      id: t.id
    }
  })
  return { combinedFriendly }
}

const getStemButtons = ({
  parentTrackId,
  stems,
  isLoggedIn,
  isOwner,
  notLoggedInClick,
  onDownload,
  following,
  track
}: {
  stems: Array<{
    downloadable: boolean
    label: string
    downloadURL?: string
    id?: ID
  }>
  parentTrackId: ID
  isLoggedIn: boolean
  isOwner: boolean
  following: boolean
  track: Track
  notLoggedInClick: () => void
  onDownload: (
    id: ID,
    cid: string,
    category?: string,
    parentTrackId?: ID
  ) => void
}) => {
  const stemButtons: DownloadButtonProps[] = stems.map(u => {
    const state = (() => {
      if (!isLoggedIn) return ButtonState.LOG_IN_REQUIRED

      const requiresFollow = doesRequireFollow(isOwner, following, track)
      if (requiresFollow) return ButtonState.REQUIRES_FOLLOW

      return u.downloadable ? ButtonState.DOWNLOADABLE : ButtonState.PROCESSING
    })()

    const onClick = (() => {
      const { downloadURL, id } = u
      if (downloadURL !== undefined && id !== undefined)
        return () => {
          if (!isLoggedIn) notLoggedInClick()
          onDownload(id, downloadURL, u.label, parentTrackId)
        }
    })()

    return {
      label: u.label,
      downloadURL: u.downloadURL,
      type: ButtonType.STEM,
      state,
      onClick
    }
  })
  return stemButtons
}

const makeDownloadOriginalButton = ({
  isOwner,
  isLoggedIn,
  notLoggedInClick,
  following,
  track,
  onDownload,
  stemButtonsLength
}: {
  isOwner: boolean
  isLoggedIn: boolean
  notLoggedInClick: () => void
  following: boolean
  track: Track | null
  onDownload: (
    id: ID,
    cid: string,
    category?: string,
    parentTrackId?: ID
  ) => void
  stemButtonsLength: number
}) => {
  if (!track?.download?.is_downloadable) return undefined

  const label = messages.getDownloadTrack(stemButtonsLength)
  const ret: DownloadButtonProps = {
    state: ButtonState.PROCESSING,
    label,
    type: ButtonType.TRACK
  }

  const requiresFollow = doesRequireFollow(isOwner, following, track)
  if (isLoggedIn && requiresFollow) {
    ret.state = ButtonState.REQUIRES_FOLLOW
    return ret
  }

  const { cid } = track.download
  if (cid) {
    ret.state = isLoggedIn
      ? ButtonState.DOWNLOADABLE
      : ButtonState.LOG_IN_REQUIRED
    ret.onClick = () => {
      if (!isLoggedIn) notLoggedInClick()
      onDownload(track.track_id, cid)
    }
  }

  return ret
}

export const useButtons = (
  trackId: ID,
  onDownload: (
    trackID: number,
    cid: string,
    category?: string,
    parentTrackId?: ID
  ) => void,
  isOwner: boolean,
  following: boolean
) => {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector(getHasAccount)
  const { pathname } = useLocation()

  const notLoggedInClick = useCallback(() => {
    dispatch(updateRouteOnCompletion(pathname))
    dispatch(updateRouteOnExit(pathname))
    dispatch(openSignOn())
    dispatch(showRequiresAccountModal())
  }, [dispatch, pathname])

  // Get already uploaded stems and parent track
  const { stemTracks, track } = useCurrentStems(trackId)

  // Get the currently uploading stems
  const { uploadingTracks } = useUploadingStems(trackId)
  if (!track) return []

  // Combine uploaded and uploading stems
  const combinedStems = [...stemTracks, ...uploadingTracks] as Array<{
    category: StemCategory
    downloadable: boolean
    downloadURL?: string
    id?: ID
  }>

  // Give the stems friendly names
  const { combinedFriendly } = getFriendlyNames(combinedStems)

  // Make buttons for stems
  const stemButtons = getStemButtons({
    parentTrackId: trackId,
    stems: combinedFriendly,
    isLoggedIn,
    isOwner,
    notLoggedInClick,
    onDownload,
    following,
    track
  })

  // Make download original button
  const originalTrackButton = makeDownloadOriginalButton({
    isOwner,
    isLoggedIn,
    following,
    notLoggedInClick,
    track,
    onDownload,
    stemButtonsLength: stemButtons.length
  })

  return [...(originalTrackButton ? [originalTrackButton] : []), ...stemButtons]
}
