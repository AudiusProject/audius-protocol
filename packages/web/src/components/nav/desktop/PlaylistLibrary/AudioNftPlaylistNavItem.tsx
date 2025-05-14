import { useCurrentAccount } from '@audius/common/api'
import { SmartCollectionVariant } from '@audius/common/models'

import { SMART_COLLECTION_MAP } from 'common/store/smart-collection/smartCollections'
import { audioNftPlaylistPage } from 'utils/route'

import { CollectionNavItem } from './CollectionNavItem'

type AudioNftPlaylistNavItemProps = {
  level: number
}

export const AudioNftPlaylistNavItem = (
  props: AudioNftPlaylistNavItemProps
) => {
  const { level } = props
  const playlistId = SmartCollectionVariant.AUDIO_NFT_PLAYLIST
  const playlist = SMART_COLLECTION_MAP[playlistId]
  const { playlist_name } = playlist
  const { data: accountHandle } = useCurrentAccount({
    select: (data) => data?.user.handle
  })

  if (!accountHandle) return null

  const url = audioNftPlaylistPage(accountHandle)

  return (
    <CollectionNavItem
      id={playlistId}
      name={playlist_name}
      url={url}
      isOwned={false}
      level={level}
      hasUpdate={false}
    />
  )
}
