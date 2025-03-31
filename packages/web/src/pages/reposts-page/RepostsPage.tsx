import { useContext, useEffect } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { RepostsUserList } from 'components/user-list/lists/RepostsUserList'

const messages = {
  title: 'Reposts'
}

const RepostsPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <RepostsUserList />
    </MobilePageContainer>
  )
}

export default RepostsPage
