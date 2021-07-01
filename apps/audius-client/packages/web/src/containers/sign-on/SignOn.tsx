import React from 'react'

import { connect } from 'react-redux'

import { Pages } from 'containers/sign-on/store/types'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import SignOnProvider from './SignOnProvider'
import SignOnDesktopPage from './components/desktop/SignOnPage'
import SignOnMobilePage from './components/mobile/SignOnPage'
import { getPage } from './store/selectors'

type OwnProps = {
  signIn: boolean
  initialPage: boolean
  page?: Pages
}

type SignOnContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const SignOn = ({
  isMobile,
  signIn,
  page,
  initialPage
}: SignOnContentProps) => {
  const content = isMobile ? SignOnMobilePage : SignOnDesktopPage
  return (
    <SignOnProvider
      isMobile={isMobile}
      signIn={signIn}
      initialPage={initialPage}
      page={page}
    >
      {content}
    </SignOnProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile(),
    page: getPage(state)
  }
}

export default connect(mapStateToProps)(SignOn)
