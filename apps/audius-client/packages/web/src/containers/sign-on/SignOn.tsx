import React from 'react'

import { connect } from 'react-redux'

import { Pages } from 'containers/sign-on/store/types'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import SignOnProvider from './SignOnProvider'
import SignOnDesktopPage from './components/desktop/SignOnPage'
import SignOnMobilePage from './components/mobile/SignOnPage'
import { getPage } from './store/selectors'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

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
  return !NATIVE_MOBILE ? (
    <SignOnProvider
      isMobile={isMobile}
      signIn={signIn}
      initialPage={initialPage}
      page={page}
    >
      {content}
    </SignOnProvider>
  ) : null
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile(),
    page: getPage(state)
  }
}

export default connect(mapStateToProps)(SignOn)
