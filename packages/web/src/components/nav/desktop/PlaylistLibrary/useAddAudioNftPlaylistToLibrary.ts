import { useEffect } from 'react'

import { useCurrentAccount, useCurrentAccountUser } from '@audius/common/api'
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
  const { data: hasNftPlaylists } = useCurrentAccount({
    select: (account) => {
      const playlistLibrary = account?.playlistLibrary
      if (!playlistLibrary) return false
      if (
        findInPlaylistLibrary(
          playlistLibrary,
          SmartCollectionVariant.AUDIO_NFT_PLAYLIST
        )
      ) {
        return false
      }
      return true
    }
  })
  const { data: hasAudioNfts } = useCurrentAccountUser({
    select: (account) => {
      const accountCollectibles = account?.collectibleList
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
    if (hasNftPlaylists && hasAudioNfts) {
      dispatch(
        saveSmartCollection(
          AUDIO_NFT_PLAYLIST.playlist_name,
          FavoriteSource.IMPLICIT
        )
      )
    }
  }, [hasNftPlaylists, hasAudioNfts, dispatch])
}
