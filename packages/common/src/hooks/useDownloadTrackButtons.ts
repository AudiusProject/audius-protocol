import { useEffect, useMemo, useState } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import { isEqual } from 'lodash'
import { shallowEqual, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import dayjs from '~/utils/dayjs'
import { encodeHashId } from '~/utils/hashIds'

import { ID } from '../models/Identifiers'
import { stemCategoryFriendlyNames, StemCategory } from '../models/Stems'
import { Track, StemTrack } from '../models/Track'
import { getHasAccount } from '../store/account/selectors'
import { getTrack, getTracks } from '../store/cache/tracks/selectors'
import { CommonState } from '../store/commonStore'
import { getCurrentUploads } from '../store/stems-upload/selectors'
import { DownloadQuality } from '~/models'

export type DownloadButtonConfig = {
  state: ButtonState
  type: ButtonType
  label: string
  onClick?: () => void
}

export enum ButtonState {
  PROCESSING,
  LOG_IN_REQUIRED,
  DOWNLOADABLE,
  REQUIRES_FOLLOW
}

export enum ButtonType {
  STEM,
  TRACK
}

type Stem = {
  category: StemCategory
  downloadable: boolean
  downloadURL?: string
  id?: ID
}

type LabeledStem = Omit<Stem, 'category'> & { label: string }

type UseDownloadTrackButtonsArgs = {
  following: boolean
  isOwner: boolean
  onDownload: ({
    trackId,
    category,
    original,
    parentTrackId
  }: {
    trackId: number
    category?: string
    original?: boolean
    parentTrackId?: ID
  }) => void
  onNotLoggedInClick?: () => void
}

const messages = {
  getDownloadTrack: (stemCount: number) => `${stemCount ? 'Original' : ''}`,
  getDownloadStem: (friendlyName: string, categoryCount: number) =>
    `${friendlyName} ${categoryCount || ''}`
}

const sortByDateAsc = (a: Track, b: Track) =>
  dayjs(a.created_at).diff(dayjs(b.created_at))

const doesRequireFollow = (
  isOwner: boolean,
  following: boolean,
  track: Track
) => !isOwner && !following && track.download?.requires_follow

export const useCurrentStems = ({ trackId }: { trackId: ID }) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const stemIds = (track?._stems ?? []).map((s) => s.track_id)
  const stemTracksMap = useSelector(
    (state: CommonState) => getTracks(state, { ids: stemIds }),
    shallowEqual
  ) as { [id: number]: StemTrack }

  // Sort the stems, filter deletes
  const stemTracks = Object.values(stemTracksMap)
    .filter((t) => !t._marked_deleted && !t.is_delete)
    .sort(sortByDateAsc)
    .map((t) => ({
      downloadURL: t.download?.cid,
      category: t.stem_of.category,
      downloadable: true,
      id: t.track_id
    }))
    .filter((t) => t.downloadURL)
  return { stemTracks, track }
}

export const useFileSizes = ({
  audiusSdk,
  trackIds,
  downloadQuality
}: {
  audiusSdk: () => Promise<AudiusSdk>
  trackIds: ID[]
  downloadQuality: DownloadQuality
}) => {
  const previousTrackIds = usePrevious(trackIds)
  const previousDownloadQuality = usePrevious(downloadQuality)
  const [sizes, setSizes] = useState<{ [trackId: ID]: { [k in DownloadQuality]: number } }>({})
  useEffect(() => {
    if (!isEqual(previousTrackIds, trackIds) || previousDownloadQuality !== downloadQuality) {
      const asyncFn = async () => {
        const sdk = await audiusSdk()
        const sizeResults = await Promise.all(
          trackIds.map(async (trackId) => {
            if (sizes[trackId]?.[downloadQuality]) {
              return { trackId, size: sizes[trackId] }
            }
            try {
              const res = await sdk.tracks.inspectTrack({
                trackId: encodeHashId(trackId),
                original: downloadQuality === DownloadQuality.ORIGINAL
              })
              const size = res?.data?.size ?? null
              return { trackId, size: { [downloadQuality]: size, ...(sizes[trackId] ?? {}) } }
            } catch (e) {
              console.error(e)
              return { trackId, size: {} }
            }
          })
        )
        setSizes((sizes) => ({
          ...sizes,
          ...sizeResults.reduce((acc, curr) => {
            acc[curr.trackId] = {...(acc[curr.trackId] || {}), ...curr.size}
            return acc
          }, {} as { trackId: ID; size: { [k in DownloadQuality]: number } })
        }))
      }
      asyncFn()
    }
  }, [trackIds, previousTrackIds, audiusSdk, sizes, setSizes, downloadQuality, previousDownloadQuality])
  return sizes
}

const useUploadingStems = ({ trackId }: { trackId: ID }) => {
  const currentUploads = useSelector(
    (state: CommonState) => getCurrentUploads(state, trackId),
    shallowEqual
  )
  const uploadingTracks = currentUploads.map((u) => ({
    category: u.category,
    downloadable: false
  }))
  return { uploadingTracks }
}

const getFriendlyNames = (stems: Stem[]): LabeledStem[] => {
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

  return stems.map((t) => {
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
}

const getStemButtons = ({
  following,
  isLoggedIn,
  isOwner,
  onDownload,
  onNotLoggedInClick,
  parentTrackId,
  stems,
  track
}: UseDownloadTrackButtonsArgs & {
  isLoggedIn: boolean
  stems: LabeledStem[]
  parentTrackId: ID
  track: Track | null
}) => {
  if (!track) return []
  return stems.map((u) => {
    const state = (() => {
      if (!isLoggedIn) return ButtonState.LOG_IN_REQUIRED

      const requiresFollow = doesRequireFollow(isOwner, following, track)
      if (requiresFollow) return ButtonState.REQUIRES_FOLLOW

      return u.downloadable ? ButtonState.DOWNLOADABLE : ButtonState.PROCESSING
    })()

    const onClick = (() => {
      const { downloadURL, id } = u
      if (downloadURL !== undefined && id !== undefined) {
        return () => {
          if (!isLoggedIn) {
            onNotLoggedInClick?.()
          }
          onDownload({ trackId: id, category: u.label, parentTrackId })
        }
      } else {
        return undefined
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
}

const useMakeDownloadOriginalButton = ({
  following,
  isLoggedIn,
  isOwner,
  onNotLoggedInClick,
  onDownload,
  stemButtonsLength,
  track
}: UseDownloadTrackButtonsArgs & {
  isLoggedIn: boolean
  track: Track | null
  stemButtonsLength: number
}) => {
  return useMemo(() => {
    if (!track?.download?.is_downloadable) {
      return undefined
    }

    const label = messages.getDownloadTrack(stemButtonsLength)
    const config = {
      label,
      type: ButtonType.TRACK
    }

    const requiresFollow = doesRequireFollow(isOwner, following, track)
    if (isLoggedIn && requiresFollow) {
      return {
        ...config,
        state: ButtonState.REQUIRES_FOLLOW
      }
    }

    return {
      ...config,
      state: isLoggedIn
        ? ButtonState.DOWNLOADABLE
        : ButtonState.LOG_IN_REQUIRED,
      onClick: () => {
        if (!isLoggedIn) {
          onNotLoggedInClick?.()
        }
        onDownload({ trackId: track.track_id })
      }
    }
  }, [
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    stemButtonsLength,
    track,
    onNotLoggedInClick
  ])
}
export const useDownloadTrackButtons = ({
  following,
  isOwner,
  onDownload,
  onNotLoggedInClick,
  trackId
}: UseDownloadTrackButtonsArgs & {
  trackId: ID
}) => {
  const isLoggedIn = useSelector(getHasAccount)

  // Get already uploaded stems and parent track
  const { stemTracks, track } = useCurrentStems({ trackId })

  // Get the currently uploading stems
  const { uploadingTracks } = useUploadingStems({ trackId })

  // Combine uploaded and uploading stems
  const combinedStems = [...stemTracks, ...uploadingTracks] as Stem[]

  // Give the stems friendly names
  const combinedFriendly = getFriendlyNames(combinedStems)

  // Make buttons for stems
  const stemButtons = getStemButtons({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    parentTrackId: trackId,
    stems: combinedFriendly,
    track
  })

  // Make download original button
  const originalTrackButton = useMakeDownloadOriginalButton({
    following,
    isLoggedIn,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    stemButtonsLength: stemButtons.length,
    track
  })

  if (!track) return []

  return [...(originalTrackButton ? [originalTrackButton] : []), ...stemButtons]
}
