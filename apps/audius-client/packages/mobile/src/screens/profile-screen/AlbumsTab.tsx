import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionList } from './CollectionList'
import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't created any albums yet"
}

export const AlbumsTab = () => {
  const { profile, albums } = useSelectorWeb(getProfile)
  if (!profile || !albums) return null

  return (
    <CollectionList
      collection={albums}
      profile={profile}
      emptyTabText={messages.emptyTabText}
    />
  )
}
