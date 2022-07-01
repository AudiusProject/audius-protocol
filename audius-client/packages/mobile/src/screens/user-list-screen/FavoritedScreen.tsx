import { useCallback } from 'react'

import { setFavorite } from 'audius-client/src/common/store/user-list/favorites/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/favorites/selectors'

import IconHeart from 'app/assets/images/iconHeart.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Favorites'
}

export const FavoritedScreen = () => {
  const { params } = useRoute<'Favorited'>()
  const { id, favoriteType } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetFavorited = useCallback(() => {
    dispatchWeb(setFavorite(id, favoriteType))
  }, [dispatchWeb, id, favoriteType])

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
