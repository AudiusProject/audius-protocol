import { useContext, useEffect } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { TopSupportersUserList } from 'components/user-list/lists/TopSupportersUserList'

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
      <TopSupportersUserList />
    </MobilePageContainer>
  )
}

export default TopSupportersPage
