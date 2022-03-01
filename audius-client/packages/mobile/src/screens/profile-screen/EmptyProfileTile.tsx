import { User } from 'audius-client/src/common/models/User'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'

import { EmptyTile } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const messages = {
  you: 'You',
  haveNot: "haven't",
  hasNot: "hasn't",
  tracks: 'created any tracks yet',
  albums: 'created any albums yet',
  playlists: 'created any playlists yet',
  reposts: 'reposted anything yet'
}

type Tab = 'tracks' | 'albums' | 'playlists' | 'reposts'

export const useEmptyProfileText = (profile: Nullable<User>, tab: Tab) => {
  const accountUser = useSelectorWeb(getAccountUser)

  if (!profile) return ''
  const { user_id, name } = profile
  const isOwner = user_id === accountUser?.user_id
  const youAction = `${messages.you} ${messages.haveNot}`
  const nameAction = `${name} ${messages.hasNot}`
  return `${isOwner ? youAction : nameAction} ${messages[tab]}`
}

type EmptyProfileTileProps = {
  profile: User
  tab: Tab
}

export const EmptyProfileTile = (props: EmptyProfileTileProps) => {
  const { tab, profile } = props
  const emptyText = useEmptyProfileText(profile, tab)

  return <EmptyTile message={emptyText} />
}
