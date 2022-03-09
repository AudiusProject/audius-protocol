import { useCallback } from 'react'

import { setFavorite } from 'audius-client/src/common/store/user-list/favorites/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/favorites/selectors'

import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'

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
    <Screen title={messages.title} variant='secondary'>
      <UserList
        userSelector={getUserList}
        tag='FAVORITES'
        setUserList={handleSetFavorited}
      />
    </Screen>
  )
}
