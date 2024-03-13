import { useEffect, useState } from 'react'

import type { AudiusSdk } from '@audius/sdk'
import { isEqual } from 'lodash'
import { shallowEqual, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { DownloadQuality } from '~/models'
import dayjs from '~/utils/dayjs'
import { encodeHashId } from '~/utils/hashIds'

import { ID } from '../models/Identifiers'
import { Track, StemTrack } from '../models/Track'
import { getTrack, getTracks } from '../store/cache/tracks/selectors'
import { CommonState } from '../store/commonStore'
import { getCurrentUploads } from '../store/stems-upload/selectors'

const sortByDateAsc = (a: Track, b: Track) =>
  dayjs(a.created_at).diff(dayjs(b.created_at))

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
  const [sizes, setSizes] = useState<{
    [trackId: ID]: { [k in DownloadQuality]: number }
  }>({})
  useEffect(() => {
    if (
      !isEqual(previousTrackIds, trackIds) ||
      previousDownloadQuality !== downloadQuality
    ) {
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
              return {
                trackId,
                size: { [downloadQuality]: size, ...(sizes[trackId] ?? {}) }
              }
            } catch (e) {
              console.error(e)
              return { trackId, size: {} }
            }
          })
        )
        setSizes((sizes) => ({
          ...sizes,
          ...sizeResults.reduce((acc, curr) => {
            acc[curr.trackId] = { ...(acc[curr.trackId] || {}), ...curr.size }
            return acc
          }, {} as { trackId: ID; size: { [k in DownloadQuality]: number } })
        }))
      }
      asyncFn()
    }
  }, [
    trackIds,
    previousTrackIds,
    audiusSdk,
    sizes,
    setSizes,
    downloadQuality,
    previousDownloadQuality
  ])
  return sizes
}

export const useUploadingStems = ({ trackId }: { trackId: ID }) => {
  const currentUploads = useSelector(
    (state: CommonState) => getCurrentUploads(state, trackId),
    shallowEqual
  )
  const uploadingTracks = currentUploads.map((u) => ({
    name: u.file?.name ?? '', // the file should always exist here
    size: u.file?.size ?? 0, // the file should always exist here
    category: u.category,
    downloadable: false
  }))
  return { uploadingTracks }
}
