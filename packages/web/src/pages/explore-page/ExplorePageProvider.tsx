import { ComponentType, useEffect } from 'react'

import { explorePageSelectors, explorePageActions } from '@audius/common/store'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'
import { push } from 'utils/navigation'
import { createSeoDescription } from 'utils/seo'

import { ExplorePageProps as DesktopExplorePageProps } from './components/desktop/ExplorePage'
import { ExplorePageProps as MobileExplorePageProps } from './components/mobile/ExplorePage'
const { makeGetExplore } = explorePageSelectors
const { fetchExplore } = explorePageActions

const messages = {
  title: 'Explore',
  pageTitle: 'Explore featured content on Audius',
  description: createSeoDescription('Explore featured content on Audius')
}

type OwnProps = {
  children:
    | ComponentType<MobileExplorePageProps>
    | ComponentType<DesktopExplorePageProps>
}

type ExplorePageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const ExplorePage = ({
  explore,
  fetchExplore,
  goToRoute,
  children: Children
}: ExplorePageProps) => {
  useEffect(() => {
    fetchExplore()
  }, [fetchExplore])

  const childProps = {
    title: messages.title,
    pageTitle: messages.pageTitle,
    description: messages.description,
    // Props from AppState
    playlists: explore.playlists,
    profiles: explore.profiles,
    status: explore.status,

    // Props from dispatch
    goToRoute
  }

  const mobileProps = {}

  const desktopProps = {}

  return <Children {...childProps} {...mobileProps} {...desktopProps} />
}

function makeMapStateToProps() {
  const getExplore = makeGetExplore()
  const mapStateToProps = (state: AppState) => {
    return {
      explore: getExplore(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchExplore: () => dispatch(fetchExplore()),
    goToRoute: (route: string) => dispatch(push(route))
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ExplorePage)
)
