import { useCallback } from 'react'

import type { User } from '@audius/common'
import {
  profilePageSelectors,
  MAX_PROFILE_RELATED_ARTISTS,
  FeatureFlags,
  useGetRelatedArtists
} from '@audius/common'
import {} from '@audius/stems'
import { IconUserGroup } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { ProfilePageNavSectionTitle } from 'components/profile-page-nav-section-title/ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from 'components/profile-picture-list-tile/ProfilePictureListTile'
import { useFlag } from 'hooks/useRemoteConfig'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './RelatedArtists.module.css'
const { getProfileUser } = profilePageSelectors

const messages = {
  relatedArtists: 'Related Artists'
}

export const RelatedArtists = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)
  const { isEnabled: isRelatedArtistsEnabled } = useFlag(
    FeatureFlags.RELATED_ARTISTS_ON_PROFILE_ENABLED
  )

  const artistId = profile?.user_id

  const { data: relatedArtists } = useGetRelatedArtists(
    { artistId: artistId! },
    { disabled: !artistId }
  )

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

  if (
    !isRelatedArtistsEnabled ||
    !profile ||
    !relatedArtists ||
    relatedArtists.length === 0
  ) {
    return null
  }

  return (
    <div>
      <ProfilePageNavSectionTitle
        title={messages.relatedArtists}
        titleIcon={<IconUserGroup className={styles.userGroupIcon} />}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={relatedArtists as User[]}
        totalUserCount={relatedArtists.length}
        limit={MAX_PROFILE_RELATED_ARTISTS}
        disableProfileClick
      />
    </div>
  )
}
