import { useContext, useEffect } from 'react'

import {
  followersUserListSelectors,
  FOLLOWERS_USER_LIST_TAG
} from '@audius/common/store'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { UserList } from 'components/user-list/UserList'

const { getUserList } = followersUserListSelectors

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
      <UserList stateSelector={getUserList} tag={FOLLOWERS_USER_LIST_TAG} />
    </MobilePageContainer>
  )
}

export default FollowersPage
