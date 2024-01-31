import {
  favoritesUserListActions,
  favoritesUserListSelectors
} from '@audius/common/store'
import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import IconHeart from 'app/assets/images/iconHeart.svg'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { getUserList } = favoritesUserListSelectors
const { setFavorite } = favoritesUserListActions

const messages = {
  title: 'Favorites'
}

export const FavoritedScreen = () => {
  const { params } = useRoute<'Favorited'>()
  const { id, favoriteType } = params
  const dispatch = useDispatch()

  const handleSetFavorited = useCallback(() => {
    dispatch(setFavorite(id, favoriteType))
  }, [dispatch, id, favoriteType])

  return (
    <UserListScreen title={messages.title} titleIcon={IconHeart}>
      <UserList
        userSelector={getUserList}
        tag='FAVORITES'
        setUserList={handleSetFavorited}
      />
    </UserListScreen>
  )
}
