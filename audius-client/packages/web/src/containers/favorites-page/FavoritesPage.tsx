import React, { useEffect, useContext } from 'react'

import MobilePageContainer from 'components/general/MobilePageContainer'
import NavContext, { LeftPreset } from 'containers/nav/store/context'
import UserList from 'containers/user-list/UserList'

import { getUserList } from './store/selectors'

const messages = {
  title: 'Favorites'
}

export const USER_LIST_TAG = 'FAVORITES'

// Eventually calculate a custom page size
export const PAGE_SIZE = 15

const FavoritesPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <UserList
        stateSelector={getUserList}
        tag={USER_LIST_TAG}
        pageSize={PAGE_SIZE}
      />
    </MobilePageContainer>
  )
}

export default FavoritesPage
