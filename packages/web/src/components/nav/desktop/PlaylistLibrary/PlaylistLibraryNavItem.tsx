import { PlaylistLibraryItem } from '@audius/common/models'

import { PlaylistFolderNavItem } from './PlaylistFolderNavItem'
import { PlaylistNavItem } from './PlaylistNavItem'

type PlaylistLibraryNavItemProps = {
  item: PlaylistLibraryItem
  level: number
}

export const keyExtractor = (item: PlaylistLibraryItem) => {
  switch (item.type) {
    case 'folder':
      return item.id
    case 'playlist':
      return item.playlist_id
  }
}

export const PlaylistLibraryNavItem = (props: PlaylistLibraryNavItemProps) => {
  const { item, level } = props

  switch (item.type) {
    case 'folder':
      return <PlaylistFolderNavItem folder={item} level={level} />
    case 'playlist':
      return <PlaylistNavItem playlistId={item.playlist_id} level={level} />
    default:
      return null
  }
}
