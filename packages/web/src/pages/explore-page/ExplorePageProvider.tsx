import { ComponentType, useEffect } from 'react'

import {
  accountSelectors,
  explorePageSelectors,
  explorePageActions
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'
import { createSeoDescription } from 'utils/seo'

import { ExplorePageProps as DesktopExplorePageProps } from './components/desktop/ExplorePage'
import { ExplorePageProps as MobileExplorePageProps } from './components/mobile/ExplorePage'
const { makeGetExplore } = explorePageSelectors
const { fetchExplore } = explorePageActions
const getAccountUser = accountSelectors.getAccountUser

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
  account,
  explore,
  fetchExplore,
  goToRoute,
  children: Children
}: ExplorePageProps) => {
  useEffect(() => {
    fetchExplore()
  }, [fetchExplore])

  const formatPlaylistCardSecondaryText = (saves: number, tracks: number) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const tracksText = tracks === 1 ? 'Track' : 'Tracks'
    return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
  }

  const formatProfileCardSecondaryText = (followers: number) => {
    const followersText = followers === 1 ? 'Follower' : 'Followers'
    return `${formatCount(followers)} ${followersText}`
  }

  const childProps = {
    title: messages.title,
    pageTitle: messages.pageTitle,
    description: messages.description,
    // Props from AppState
    account,
    playlists: explore.playlists,
    profiles: explore.profiles,
    status: explore.status,
    formatPlaylistCardSecondaryText,
    formatProfileCardSecondaryText,

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
      account: getAccountUser(state),
      explore: getExplore(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchExplore: () => dispatch(fetchExplore()),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ExplorePage)
)
