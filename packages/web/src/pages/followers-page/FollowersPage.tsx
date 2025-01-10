import { useContext, useEffect } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { FollowersUserList } from 'components/user-list/lists/FollowersUserList'

const messages = {
  title: 'Followers'
}

const FollowersPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <FollowersUserList />
    </MobilePageContainer>
  )
}

export default FollowersPage
