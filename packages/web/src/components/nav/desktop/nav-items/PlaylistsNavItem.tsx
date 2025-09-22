import React, { useState, useCallback } from 'react'

import {
  useCurrentAccountUser,
  selectIsAccountComplete,
  useHasAccount
} from '@audius/common/api'
import { IconPlaylists } from '@audius/harmony'

import { PlaylistLibrary } from '../PlaylistLibrary'
import { CreatePlaylistLibraryItemButton } from '../PlaylistLibrary/CreatePlaylistLibraryItemButton'
import { RestrictedExpandableNavItem } from '../RestrictedExpandableNavItem'

export const PlaylistsNavItem = () => {
  const hasAccount = useHasAccount()
  const { data: isAccountComplete = false } = useCurrentAccountUser({
    select: selectIsAccountComplete
  })
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = useCallback((isOpen: boolean) => {
    setIsOpen(isOpen)
  }, [])

  return (
    <RestrictedExpandableNavItem
      label='Playlists'
      leftIcon={IconPlaylists}
      rightIcon={<CreatePlaylistLibraryItemButton />}
      shouldPersistRightIcon={true}
      nestedItems={isOpen ? <PlaylistLibrary /> : null}
      restriction='account'
      canUnfurl={isAccountComplete}
      disabled={!hasAccount}
      onToggle={handleToggle}
    />
  )
}
