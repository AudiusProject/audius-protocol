import { useCallback, useRef, useState } from 'react'

import { FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Divider,
  Flex,
  IconCloudUpload,
  IconExplore,
  IconFeed,
  IconLibrary,
  IconMessages,
  IconTrending,
  IconTrophy,
  IconWallet,
  Scrollbar
} from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import { DragAutoscroller } from 'components/drag-autoscroller/DragAutoscroller'
import { ProfileCompletionPanel } from 'components/profile-progress/ProfileCompletionPanel'
import { selectDraggingKind } from 'store/dragndrop/slice'
import { AppState } from 'store/types'
import { useSelector } from 'utils/reducer'

import { AccountDetails } from './AccountDetails'
import { LeftNavLink } from './LeftNavLink'
import { NavHeader } from './NavHeader'
import { NowPlayingArtworkTile } from './NowPlayingArtworkTile'
import { PlaylistLibrary } from './PlaylistLibrary'
import { RouteNav } from './RouteNav'

const {
  EXPLORE_PAGE,
  FEED_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE,
  CHATS_PAGE,
  PAYMENTS_PAGE,
  AUDIO_PAGE,
  UPLOAD_PAGE
} = route
const { saveTrack } = tracksSocialActions
const { saveCollection } = collectionsSocialActions
const { getAccountStatus, getUserId, getUserHandle, getIsAccountComplete } =
  accountSelectors

export const LEFT_NAV_WIDTH = 240

type OwnProps = {
  isElectron: boolean
}

type NavColumnProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const LeftNav = (props: NavColumnProps) => {
  const { isElectron } = props
  const isAccountComplete = useSelector(getIsAccountComplete)
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

  const updateScrollTopPosition = useCallback((difference: number) => {
    if (scrollbarRef != null && scrollbarRef.current !== null) {
      scrollbarRef.current.scrollTop =
        scrollbarRef.current.scrollTop + difference
    }
  }, [])

  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false)

  const handlePlaylistToggle = useCallback(() => {
    setIsPlaylistExpanded(!isPlaylistExpanded)
  }, [isPlaylistExpanded])

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
              : dragScrollingDirection === 'down'
              ? 'inset 0px -8px 5px -5px var(--tile-shadow-3)'
              : undefined,
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
            <Flex direction='column' gap='unit2' flex='1 1 auto' p={6}>
              <LeftNavLink
                to={FEED_PAGE}
                disabled={!isAccountComplete}
                restriction='account'
                icon={IconFeed}
              >
                Feed
              </LeftNavLink>
              <LeftNavLink
                to={TRENDING_PAGE}
                restriction='none'
                icon={IconTrending}
              >
                Trending
              </LeftNavLink>
              <LeftNavLink
                to={EXPLORE_PAGE}
                exact
                restriction='none'
                icon={IconExplore}
              >
                Explore
              </LeftNavLink>
              <LeftNavLink
                to={LIBRARY_PAGE}
                restriction='guest'
                icon={IconLibrary}
              >
                Library
              </LeftNavLink>
              <LeftNavLink
                to={CHATS_PAGE}
                restriction='guest'
                icon={IconMessages}
              >
                Messages
              </LeftNavLink>
              <LeftNavLink
                to={PAYMENTS_PAGE}
                restriction='guest'
                icon={IconWallet}
              >
                Wallets
              </LeftNavLink>
              <LeftNavLink
                to={AUDIO_PAGE}
                restriction='guest'
                icon={IconTrophy}
              >
                Rewards
              </LeftNavLink>
              <LeftNavLink
                to={UPLOAD_PAGE}
                restriction='guest'
                icon={IconCloudUpload}
              >
                Upload
              </LeftNavLink>
              <Divider orientation='horizontal' />
              <LeftNavLink restriction='guest' onClick={handlePlaylistToggle}>
                <PlaylistLibrary isExpanded={isPlaylistExpanded} />
              </LeftNavLink>
            </Flex>
          </DragAutoscroller>
        </Scrollbar>
      </Flex>
      <Flex direction='column' alignItems='center' pt='l' borderTop='default'>
        <ProfileCompletionPanel />
        <NowPlayingArtworkTile />
      </Flex>
    </Flex>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    accountUserId: getUserId(state),
    accountHandle: getUserHandle(state),
    accountStatus: getAccountStatus(state),
    draggingKind: selectDraggingKind(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  saveTrack: (trackId: number) =>
    dispatch(saveTrack(trackId, FavoriteSource.NAVIGATOR)),
  saveCollection: (collectionId: number) =>
    dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR))
})

const ConnectedLeftNav = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LeftNav)
)

export default ConnectedLeftNav
