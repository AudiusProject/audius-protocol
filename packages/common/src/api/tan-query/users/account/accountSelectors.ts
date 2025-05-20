import { User } from '~/models/User'
import { AccountState } from '~/store/account/types'

/**
 * Some helper utils that can be used to pass into the select option
 */
export const selectIsGuestAccount = (user?: User | null) => {
  return Boolean(!user?.handle && !user?.name)
}

export const selectAccountHasTracks = (user?: User | null) => {
  return (user?.track_count ?? 0) > 0
}

export const selectHasAccount = (user?: User | null) => {
  return Boolean(user?.handle && user?.name)
}

/**
 * Returns the account with collections sorted by name, separated into playlists and albums
 */
export const selectNameSortedPlaylistsAndAlbums = (
  account: AccountState | undefined | null
) => {
  if (!account) return undefined

  const collections = Object.values(account.collections)
  const nameSortedCollections = collections.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  return {
    playlists: nameSortedCollections.filter((c) => !c.is_album),
    albums: nameSortedCollections.filter((c) => c.is_album)
  }
}
