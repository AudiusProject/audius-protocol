import { MouseEvent, useCallback, useRef, useState } from 'react'

import {
  Name,
  FavoriteSource,
  Status,
  CreateAccountOpen
} from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions
} from '@audius/common/store'
import { Box, Flex, Scrollbar } from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import * as signOnActions from 'common/store/pages/signon/actions'
import { DragAutoscroller } from 'components/drag-autoscroller/DragAutoscroller'
import ConnectedProfileCompletionPane from 'components/profile-progress/ConnectedProfileCompletionPane'
import { selectDraggingKind } from 'store/dragndrop/slice'
import { AppState } from 'store/types'
import {
  EXPLORE_PAGE,
  FEED_PAGE,
  HISTORY_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE
} from 'utils/route'

import { AccountDetails } from './AccountDetails'
import { ConnectInstagram } from './ConnectInstagram'
import { GroupHeader } from './GroupHeader'
import styles from './LeftNav.module.css'
import { LeftNavCTA } from './LeftNavCTA'
import { LeftNavDroppable, LeftNavLink } from './LeftNavLink'
import { NavHeader } from './NavHeader'
import { NowPlayingArtworkTile } from './NowPlayingArtworkTile'
import { PlaylistLibrary } from './PlaylistLibrary'
import { RouteNav } from './RouteNav'

const { saveTrack } = tracksSocialActions
const { saveCollection } = collectionsSocialActions
const { getAccountStatus, getAccountUser } = accountSelectors

const messages = {
  discover: 'Discover',
  library: 'Your Music'
}

type OwnProps = {
  isElectron: boolean
}

type NavColumnProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const LeftNav = (props: NavColumnProps) => {
  const {
    account,
    showActionRequiresAccount,
    isElectron,
    draggingKind,
    saveTrack,
    saveCollection,
    accountStatus,
    goToSignUp: routeToSignup
  } = props
  const record = useRecord()
  const [navBodyContainerMeasureRef, navBodyContainerBoundaries] = useMeasure({
    polyfill: ResizeObserver
  })
  const scrollbarRef = useRef<HTMLElement | null>(null)
  const [dragScrollingDirection, setDragScrollingDirection] = useState<
    'up' | 'down' | undefined
  >(undefined)
  const handleChangeDragScrollingDirection = useCallback(
    (newDirection: 'up' | 'down' | undefined) => {
      setDragScrollingDirection(newDirection)
    },
    []
  )

  const goToSignUp = useCallback(
    (source: CreateAccountOpen['source']) => {
      routeToSignup()
      record(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    },
    [record, routeToSignup]
  )

  const onClickNavLinkWithAccount = useCallback(
    (e?: MouseEvent) => {
      if (!account) {
        e?.preventDefault()
        goToSignUp('restricted page')
        showActionRequiresAccount()
      }
    },
    [account, goToSignUp, showActionRequiresAccount]
  )

  const updateScrollTopPosition = useCallback((difference: number) => {
    if (scrollbarRef != null && scrollbarRef.current !== null) {
      scrollbarRef.current.scrollTop =
        scrollbarRef.current.scrollTop + difference
    }
  }, [])

  const profileCompletionMeter = (
    <div className={styles.profileCompletionContainer}>
      <ConnectedProfileCompletionPane />
    </div>
  )

  const navLoaded =
    accountStatus === Status.SUCCESS || accountStatus === Status.ERROR

  return (
    <Flex
      backgroundColor='surface1'
      borderRight='default'
      as='nav'
      id='leftNav'
      direction='column'
      h='100%'
      w='100%'
      css={{
        userSelect: 'none',
        overflow: 'visible'
      }}
    >
      {isElectron ? <RouteNav /> : null}
      <NavHeader />

      <Flex
        direction='column'
        w='100%'
        flex={1}
        ref={navBodyContainerMeasureRef}
        css={{
          boxShadow:
            dragScrollingDirection === 'up'
              ? 'inset 0px 8px 5px -5px var(--tile-shadow-3)'
              : 'inset 0px -8px 5px -5px var(--tile-shadow-3)',
          opacity: navLoaded ? 1 : 0,
          overflow: 'hidden',
          transition: 'opacity 0.3s ease-in-out, box-shadow 0.2s ease'
        }}
      >
        <Scrollbar
          containerRef={(el: HTMLElement) => {
            scrollbarRef.current = el
          }}
        >
          <DragAutoscroller
            containerBoundaries={navBodyContainerBoundaries}
            updateScrollTopPosition={updateScrollTopPosition}
            onChangeDragScrollingDirection={handleChangeDragScrollingDirection}
          >
            <AccountDetails />

            <Flex
              direction='column'
              gap='unit5'
              flex='1 1 auto'
              css={{ overflow: 'hidden' }}
            >
              {account?.handle !== 'fbtest' ? (
                <Box>
                  <LeftNavLink to={'/fb/share'}>
                    Share Profile to Facebook
                  </LeftNavLink>
                  <LeftNavLink>
                    <ConnectInstagram />
                  </LeftNavLink>
                </Box>
              ) : null}
              <Box>
                <GroupHeader>{messages.discover}</GroupHeader>
                <LeftNavLink
                  to={FEED_PAGE}
                  disabled={!account}
                  onClick={onClickNavLinkWithAccount}
                >
                  Feed
                </LeftNavLink>
                <LeftNavLink to={TRENDING_PAGE}>Trending</LeftNavLink>
                <LeftNavLink to={EXPLORE_PAGE} exact>
                  Explore
                </LeftNavLink>
              </Box>
              <Box>
                <GroupHeader>{messages.library}</GroupHeader>
                <LeftNavDroppable
                  disabled={!account}
                  acceptedKinds={['track', 'album']}
                  acceptOwner={false}
                  onDrop={draggingKind === 'album' ? saveCollection : saveTrack}
                >
                  <LeftNavLink
                    to={LIBRARY_PAGE}
                    onClick={onClickNavLinkWithAccount}
                  >
                    Library
                  </LeftNavLink>
                </LeftNavDroppable>
                <LeftNavLink
                  to={HISTORY_PAGE}
                  onClick={onClickNavLinkWithAccount}
                  disabled={!account}
                >
                  History
                </LeftNavLink>
              </Box>
              <Box>
                <PlaylistLibrary scrollbarRef={scrollbarRef} />
              </Box>
            </Flex>
          </DragAutoscroller>
        </Scrollbar>
      </Flex>
      <div className={styles.navAnchor}>
        {profileCompletionMeter}
        <LeftNavCTA />
        <NowPlayingArtworkTile />
      </div>
    </Flex>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    account: getAccountUser(state),
    accountStatus: getAccountStatus(state),
    draggingKind: selectDraggingKind(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  saveTrack: (trackId: number) =>
    dispatch(saveTrack(trackId, FavoriteSource.NAVIGATOR)),
  saveCollection: (collectionId: number) =>
    dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR)),
  showActionRequiresAccount: () =>
    dispatch(signOnActions.showRequiresAccountModal()),
  goToSignUp: () => dispatch(signOnActions.openSignOn(/** signIn */ false))
})

const ConnectedLeftNav = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LeftNav)
)

export default ConnectedLeftNav
