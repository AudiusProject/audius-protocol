import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'

import { accountSelectors } from '@audius/common'
import { replace as replaceRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import * as signOnAction from 'common/store/pages/signon/actions'
import { getPage } from 'common/store/pages/signon/selectors'
import { Pages } from 'common/store/pages/signon/types'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { TRENDING_PAGE } from 'utils/route'

import SignOnProvider from './SignOnProvider'
import SignOnDesktopPage from './components/desktop/SignOnPage'
import SignOnMobilePage from './components/mobile/SignOnPage'

const getHasAccount = accountSelectors.getHasAccount

type OwnProps = {
  signIn: boolean
  initialPage: boolean
  page?: Pages
}

type SignOnContentProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps &
  OwnProps

const SignOn = ({
  hasAccount,
  isMobile,
  fetchReferrer,
  replaceRoute,
  location,
  signIn,
  page,
  initialPage
}: SignOnContentProps) => {
  const content = isMobile ? SignOnMobilePage : SignOnDesktopPage
  const [isInitialRender, setIsInitialRender] = useState(true)

  useEffect(() => {
    setIsInitialRender(false)
  }, [])

  useEffect(() => {
    // Check for referrer before redirecting if signed in to support retroactive referrals
    // @ts-ignore
    const referrerHandle = new URLSearchParams(location.search).get('ref')
    if (referrerHandle) {
      // @ts-ignore
      fetchReferrer(referrerHandle)
    }

    if (isInitialRender && hasAccount) {
      // @ts-ignore
      replaceRoute(TRENDING_PAGE)
    }
  }, [isInitialRender, hasAccount, location, fetchReferrer, replaceRoute])

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
    hasAccount: getHasAccount(state),
    page: getPage(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchReferrer: (handle: string) =>
      dispatch(signOnAction.fetchReferrer(handle)),

    replaceRoute: (route: string) => dispatch(replaceRoute(route))
  }
}

export default withRouter(
  // @ts-ignore
  connect(mapStateToProps, mapDispatchToProps)(SignOn)
) as unknown as ComponentType<{ signIn: boolean }>
