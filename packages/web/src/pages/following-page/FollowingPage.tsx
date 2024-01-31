import { useContext, useEffect } from 'react'

import {
  followingUserListSelectors,
  FOLLOWING_USER_LIST_TAG
} from '@audius/common/store'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import UserList from 'components/user-list/UserList'
const { getUserList } = followingUserListSelectors

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
      <UserList stateSelector={getUserList} tag={FOLLOWING_USER_LIST_TAG} />
    </MobilePageContainer>
  )
}

export default FollowingPage
