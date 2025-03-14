import { useContext, useEffect } from 'react'

import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { SupportingUserList } from 'components/user-list/lists/SupportingUserList'

const messages = {
  title: 'Supporting'
}

const SupportingPage = () => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer fullHeight>
      <SupportingUserList />
    </MobilePageContainer>
  )
}

export default SupportingPage
