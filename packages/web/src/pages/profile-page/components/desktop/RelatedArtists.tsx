import { useCallback } from 'react'

import { useRelatedArtistsUsers } from '@audius/common/api'
import { User } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import { MAX_PROFILE_RELATED_ARTISTS } from '@audius/common/utils'
import { IconUserGroup } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from './ProfilePictureListTile'
const { getProfileUser } = profilePageSelectors

const messages = {
  relatedArtists: 'Related Artists'
}

export const RelatedArtists = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)

  const artistId = profile?.user_id

  const { data: relatedArtists } = useRelatedArtistsUsers({
    artistId,
    pageSize: MAX_PROFILE_RELATED_ARTISTS
  })

  const handleClick = useCallback(() => {
    if (profile) {
      dispatch(
        setUsers({
          userListType: UserListType.RELATED_ARTISTS,
          entityType: UserListEntityType.USER,
          id: profile.user_id
        })
      )
      dispatch(setVisibility(true))
    }
  }, [profile, dispatch])

  if (!profile || !relatedArtists || relatedArtists.length === 0) {
    return null
  }

  return (
    <ProfilePageNavSectionItem>
      <ProfilePageNavSectionTitle
        title={messages.relatedArtists}
        Icon={IconUserGroup}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={relatedArtists as User[]}
        totalUserCount={relatedArtists.length}
        limit={MAX_PROFILE_RELATED_ARTISTS}
        disableProfileClick
      />
    </ProfilePageNavSectionItem>
  )
}
