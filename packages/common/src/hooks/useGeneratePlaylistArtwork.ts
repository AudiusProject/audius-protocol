import { useCallback } from 'react'

import { useSelector } from 'react-redux'

import { ID } from 'models/Identifiers'
import { SquareSizes } from 'models/ImageSizes'
import { useAppContext } from 'src/context'
import { getCollection } from 'store/cache/collections/selectors'
import { getTrack } from 'store/cache/tracks/selectors'
import { CommonState } from 'store/index'
import { removeNullable } from 'utils/typeUtils'

export const useGeneratePlaylistArtwork = (collectionId: ID) => {
  const collection = useSelector(
    (state: CommonState) => getCollection(state, { id: collectionId })!
  )

  const collectionTracks = useSelector((state: CommonState) => {
    const trackIds = collection.playlist_contents.track_ids.map(
      ({ track }) => track
    )
    const tracks = trackIds
      .map((trackId) => getTrack(state, { id: trackId }))
      .filter(removeNullable)
      .slice(0, 4)

    if (tracks.length < 4) {
      return tracks.slice(0, 1)
    }

    return tracks
  })

  const { imageUtils, audiusBackend } = useAppContext()

  return useCallback(async () => {
    if (collectionTracks.length === 0) {
      return { url: '', file: undefined }
    }

    const trackArtworkUrls = await Promise.all(
      collectionTracks.map(async (track) => {
        const { cover_art_sizes, cover_art } = track
        return await audiusBackend.getImageUrl(
          cover_art_sizes || cover_art,
          SquareSizes.SIZE_1000_BY_1000
        )
      })
    )

    return await imageUtils.generatePlaylistArtwork(trackArtworkUrls)
  }, [collectionTracks, audiusBackend, imageUtils])
}
