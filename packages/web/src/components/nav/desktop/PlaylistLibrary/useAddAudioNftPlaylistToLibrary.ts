import { useEffect } from 'react'

import { useCurrentAccount } from '@audius/common/api'
import { FavoriteSource, SmartCollectionVariant } from '@audius/common/models'
import {
  playlistLibraryHelpers,
  collectionsSocialActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { AUDIO_NFT_PLAYLIST } from 'common/store/smart-collection/smartCollections'
const { findInPlaylistLibrary } = playlistLibraryHelpers
const { saveSmartCollection } = collectionsSocialActions

const audioFormatSet = new Set(['mp3', 'wav', 'oga', 'mp4'])

export const useAddAudioNftPlaylistToLibrary = () => {
  const dispatch = useDispatch()
  const { data: hasUnaddedAudioNftPlaylist } = useCurrentAccount({
    select: (account) => {
      const playlistLibrary = account?.playlist_library
      if (!playlistLibrary) return false
      if (
        findInPlaylistLibrary(
          playlistLibrary,
          SmartCollectionVariant.AUDIO_NFT_PLAYLIST
        )
      ) {
        return false
      }
      const accountCollectibles = account?.user?.collectibleList
      const hasAudioNfts = accountCollectibles?.some((collectible) => {
        const { hasAudio, animationUrl, videoUrl } = collectible
        if (hasAudio) return true
        const mediaUrl = animationUrl ?? videoUrl
        const collectibleExtension = mediaUrl?.split('.').pop()
        return collectibleExtension && audioFormatSet.has(collectibleExtension)
      })

      return hasAudioNfts
    }
  })

  useEffect(() => {
    if (hasUnaddedAudioNftPlaylist) {
      dispatch(
        saveSmartCollection(
          AUDIO_NFT_PLAYLIST.playlist_name,
          FavoriteSource.IMPLICIT
        )
      )
    }
  }, [hasUnaddedAudioNftPlaylist, dispatch])
}
