import { useCallback, useEffect } from 'react'

import {
  profilePageSelectors,
  MAX_PROFILE_RELATED_ARTISTS,
  CommonState,
  relatedArtistsUISelectors as relatedArtistSelectors,
  relatedArtistsUIActions as relatedArtistsActions,
  FeatureFlags
} from '@audius/common'
import { IconUserGroup } from '@audius/stems'
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
const { selectRelatedArtists, selectRelatedArtistsUsers } =
  relatedArtistSelectors
const { fetchRelatedArtists } = relatedArtistsActions
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

  const suggestedArtists = useSelector((state: CommonState) =>
    artistId ? selectRelatedArtistsUsers(state, { id: artistId }) : null
  )
  const isTopArtistsSuggestion = useSelector((state: CommonState) =>
    artistId
      ? selectRelatedArtists(state, { id: artistId })
          ?.isTopArtistsRecommendation
      : null
  )

  // Start fetching the related artists
  useEffect(() => {
    if (!artistId) return
    dispatch(
      fetchRelatedArtists({
        artistId
      })
    )
  }, [dispatch, artistId])

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
    !suggestedArtists ||
    suggestedArtists.length === 0 ||
    isTopArtistsSuggestion
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
        users={suggestedArtists}
        totalUserCount={suggestedArtists.length}
        limit={MAX_PROFILE_RELATED_ARTISTS}
        disableProfileClick
      />
    </div>
  )
}
