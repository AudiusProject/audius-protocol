import { accountSelectors } from '@audius/common/store'

import type { StyleProp, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'

import { EmptyTile } from 'app/components/core'

import { useSelectProfile } from './selectors'
const getUserId = accountSelectors.getUserId

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

export const useEmptyProfileText = (tab: Tab) => {
  const { user_id, name } = useSelectProfile(['user_id', 'name'])
  const accountId = useSelector(getUserId)

  const isOwner = user_id === accountId

  const youAction = `${messages.you} ${messages.haveNot}`
  const nameAction = `${name} ${messages.hasNot}`
  return `${isOwner ? youAction : nameAction} ${messages[tab]}`
}

type EmptyProfileTileProps = {
  style?: StyleProp<ViewStyle>
  tab: Tab
}

export const EmptyProfileTile = (props: EmptyProfileTileProps) => {
  const { style, tab } = props
  const emptyText = useEmptyProfileText(tab)

  return <EmptyTile message={emptyText} style={style} />
}
