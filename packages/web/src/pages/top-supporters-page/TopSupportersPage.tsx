import { useContext, useEffect } from 'react'

import {
  topSupportersUserListSelectors,
  TOP_SUPPORTERS_USER_LIST_TAG as USER_LIST_TAG
} from '@audius/common/store'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { UserList } from 'components/user-list/UserList'

const { getUserList } = topSupportersUserListSelectors

const messages = {
  title: 'Top Supporters'
}

const TopSupportersPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <UserList stateSelector={getUserList} tag={USER_LIST_TAG} />
    </MobilePageContainer>
  )
}

export default TopSupportersPage
