import { useEffect, useContext } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { FavoritesUserList } from 'components/user-list/lists/FavoritesUserList'

const messages = {
  title: 'Favorites'
}

const FavoritesPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <FavoritesUserList />
    </MobilePageContainer>
  )
}

export default FavoritesPage
