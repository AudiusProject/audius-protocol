import { useCallback, useMemo, useEffect } from 'react'

import { useCollectionByPermalink, useTracks } from '@audius/common/api'
import { usePlayTrack, usePauseTrack } from '@audius/common/hooks'
import { Name, SquareSizes, Kind, ID, ModalSource } from '@audius/common/models'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  QueueSource,
  playerSelectors,
  ChatMessageTileProps,
  CommonState
} from '@audius/common/store'
import { getPathFromPlaylistUrl, makeUid } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import MobilePlaylistTile from 'components/track/mobile/ConnectedPlaylistTile'

const { getTrackId } = playerSelectors
const { getCollection } = cacheCollectionsSelectors
const { fetchCoverArt } = cacheCollectionsActions

export const ChatMessagePlaylist = ({
  link,
  onEmpty,
  onSuccess,
  className
}: ChatMessageTileProps) => {
  const dispatch = useDispatch()
  const playingTrackId = useSelector(getTrackId)

  const permalink = getPathFromPlaylistUrl(link)
  const { data: playlist, isPending } = useCollectionByPermalink(permalink)

  const collectionId = playlist?.playlist_id
  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  )

  useEffect(() => {
    if (collectionId) {
      dispatch(fetchCoverArt(collectionId, SquareSizes.SIZE_150_BY_150))
    }
  }, [collectionId, dispatch])

  const uid = useMemo(() => {
    return collectionId ? makeUid(Kind.COLLECTIONS, collectionId) : null
  }, [collectionId])

  const trackIds =
    playlist?.playlist_contents?.track_ids?.map((t) => t.track) ?? []
  const { data: tracks = [] } = useTracks(trackIds, {
    enabled: !!trackIds.length
  })

  const uidMap = useMemo(() => {
    return trackIds.reduce((result: { [id: ID]: string }, id) => {
      result[id] = makeUid(Kind.TRACKS, id)
      return result
    }, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  /**
   * Include uids for the tracks as those are used to play the tracks,
   * and also to determine which track is currently playing.
   * Also include the other properties to conform with the component.
   */
  const tracksWithUids = useMemo(() => {
    return (tracks || []).map((track) => ({
      ...track,
      user: track.user,
      id: track.track_id,
      uid: uidMap[track.track_id]
    }))
  }, [tracks, uidMap])

  const entries = useMemo(() => {
    return (tracks || []).map((track) => ({
      id: track.track_id,
      uid: uidMap[track.track_id],
      source: QueueSource.CHAT_PLAYLIST_TRACKS
    }))
  }, [tracks, uidMap])

  const play = usePlayTrack()
  const playTrack = useCallback(
    (uid: string) => {
      play({ uid, entries })
    },
    [play, entries]
  )

  const pauseTrack = usePauseTrack()

  useEffect(() => {
    if (collection && uid && !collection.is_delete) {
      dispatch(make(Name.MESSAGE_UNFURL_PLAYLIST, {}))
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [collection, uid, onSuccess, onEmpty, dispatch])

  return collection && uid ? (
    // You may wonder why we use the mobile web playlist tile here.
    // It's simply because the chat playlist tile uses the same design as mobile web.
    <MobilePlaylistTile
      containerClassName={className}
      index={0}
      uid={uid}
      collection={collection}
      tracks={tracksWithUids}
      playTrack={playTrack}
      pauseTrack={pauseTrack}
      hasLoaded={() => {}}
      isLoading={isPending}
      isTrending={false}
      numLoadingSkeletonRows={tracksWithUids.length}
      togglePlay={() => {}}
      playingTrackId={playingTrackId}
      variant='readonly'
      source={ModalSource.DirectMessageCollectionTile}
    />
  ) : null
}
