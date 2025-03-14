import { useContext, useEffect } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { FollowingUserList } from 'components/user-list/lists/FollowingUserList'

const messages = {
  title: 'Following'
}

const FollowingPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <FollowingUserList />
    </MobilePageContainer>
  )
}

export default FollowingPage
