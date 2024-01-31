import { useEffect } from 'react'

import { FavoriteSource, SmartCollectionVariant } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryHelpers,
  collectionsSocialActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { AUDIO_NFT_PLAYLIST } from 'common/store/smart-collection/smartCollections'
import { useSelector } from 'utils/reducer'
const { findInPlaylistLibrary } = playlistLibraryHelpers
const { saveSmartCollection } = collectionsSocialActions
const { getAccountCollectibles, getPlaylistLibrary } = accountSelectors

const audioFormatSet = new Set(['mp3', 'wav', 'oga', 'mp4'])

export const useAddAudioNftPlaylistToLibrary = () => {
  const dispatch = useDispatch()

  const hasUnaddedAudioNftPlaylist = useSelector((state) => {
    const playlistLibrary = getPlaylistLibrary(state)
    if (!playlistLibrary) return false
    if (
      findInPlaylistLibrary(
        playlistLibrary,
        SmartCollectionVariant.AUDIO_NFT_PLAYLIST
      )
    ) {
      return false
    }
    const accountCollectibles = getAccountCollectibles(state)
    const hasAudioNfts = accountCollectibles?.some((collectible) => {
      const { hasAudio, animationUrl } = collectible
      if (hasAudio) return true
      const collectibleExtension = animationUrl?.split('.').pop()
      return collectibleExtension && audioFormatSet.has(collectibleExtension)
    })

    return hasAudioNfts
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
