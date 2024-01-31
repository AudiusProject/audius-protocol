import { useCallback } from 'react'

import {
  relatedArtistsUserListActions,
  relatedArtistsUserListSelectors,
  RELATED_ARTISTS_USER_LIST_TAG
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import IconUserGroup from 'app/assets/images/iconUserGroup.svg'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { getUserList } = relatedArtistsUserListSelectors
const { setRelatedArtists } = relatedArtistsUserListActions

const messages = {
  title: 'Related Artists'
}

export const RelatedArtistsScreen = () => {
  const { params } = useProfileRoute<'RelatedArtists'>()
  const { userId } = params
  const dispatch = useDispatch()

  const handleSetRelatedArtists = useCallback(() => {
    dispatch(setRelatedArtists(userId))
  }, [dispatch, userId])

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserGroup}>
      <UserList
        userSelector={getUserList}
        tag={RELATED_ARTISTS_USER_LIST_TAG}
        setUserList={handleSetRelatedArtists}
      />
    </UserListScreen>
  )
}
