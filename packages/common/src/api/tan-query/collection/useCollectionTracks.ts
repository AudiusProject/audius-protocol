import { useMemo } from 'react'

import { ID, UID } from '~/models/Identifiers'
import type { EnhancedCollectionTrack } from '~/store/cache/collections/types'
import { removeNullable } from '~/utils/typeUtils'
import { Uid } from '~/utils/uid'

import { useTracks } from '../tracks/useTracks'
import { useUsers } from '../users/useUsers'

import { useCollection } from './useCollection'

export const useCollectionTracks = (uid: UID) => {
  // Get collection from UID
  const collectionId = useMemo(() => Uid.fromString(uid)?.id as ID, [uid])
  const { data: playlistTracks } = useCollection(collectionId, {
    select: (collection) => collection.playlist_contents.track_ids
  })

  // Get tracks using useTracks
  const { data: tracks } = useTracks(playlistTracks?.map((t) => t.track))

  // Get user IDs from tracks
  const userIds = useMemo(() => {
    if (!tracks) return []
    return tracks
      .map((track) => {
        if (track?.owner_id) {
          return track.owner_id
        }
        console.error(
          `Found empty track ${track?.track_id}, expected it to have an owner_id`
        )
        return null
      })
      .filter((id): id is number => id !== null)
  }, [tracks])

  // Get users using useUsers
  const { data: users } = useUsers(userIds)

  // Combine everything into EnhancedCollectionTrack[]
  const collectionTracks = useMemo(() => {
    if (!playlistTracks || !tracks || !users) return []

    const collectionSource = Uid.fromString(uid).source

    return playlistTracks
      .map((t, i) => {
        const trackUid = Uid.fromString(t.uid ?? '')
        trackUid.source = `${collectionSource}:${trackUid.source}`
        trackUid.count = i

        const track = tracks.find((tr) => tr.track_id === t.track)
        if (!track) {
          console.error(`Found empty track ${t.track}`)
          return null
        }

        const user = users[track.owner_id]
        if (!user) {
          console.error(`Found empty user ${track.owner_id}`)
          return null
        }

        return {
          ...track,
          uid: trackUid.toString(),
          user
        }
      })
      .filter(removeNullable) as EnhancedCollectionTrack[]
  }, [playlistTracks, tracks, users, uid])

  return collectionTracks
}
