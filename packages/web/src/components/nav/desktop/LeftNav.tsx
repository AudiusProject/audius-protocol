import { Fragment, useCallback, useRef, useState } from 'react'

import { FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions
} from '@audius/common/store'
import { Box, Divider, Flex, Scrollbar } from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import { DragAutoscroller } from 'components/drag-autoscroller/DragAutoscroller'
import { ProfileCompletionPanel } from 'components/profile-progress/ProfileCompletionPanel'
import { useAccountTransition } from 'hooks/useAccountTransition'
import { selectDraggingKind } from 'store/dragndrop/slice'
import { AppState } from 'store/types'

import { AccountDetails } from './AccountDetails'
import { LeftNavCTA } from './LeftNavCTA'
import { LeftNavLink } from './LeftNavLink'
import { NavHeader } from './NavHeader'
import { NowPlayingArtworkTile } from './NowPlayingArtworkTile'
import { RestrictedExpandableNavItem } from './RestrictedExpandableNavItem'
import { RouteNav } from './RouteNav'
import { NavItemConfig, useNavConfig } from './useNavConfig'

const { saveTrack } = tracksSocialActions
const { saveCollection } = collectionsSocialActions
const { getAccountStatus, getUserId, getUserHandle } = accountSelectors

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
  const [navBodyContainerMeasureRef, navBodyContainerBoundaries] = useMeasure({
    polyfill: ResizeObserver
  })
  const scrollbarRef = useRef<HTMLElement | null>(null)
  const [dragScrollingDirection, setDragScrollingDirection] = useState<
    'up' | 'down' | undefined
  >(undefined)

  const navConfig = useNavConfig()
  const { isTransitioning } = useAccountTransition()

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

  const renderNavItem = useCallback(
    (item: NavItemConfig) => {
      if (item.isExpandable) {
        const NestedComponent = item.nestedComponent
        return (
          <RestrictedExpandableNavItem
            key={item.label}
            label={item.label}
            leftIcon={item.leftIcon}
            rightIcon={item.rightIcon}
            shouldPersistRightIcon={item.shouldPersistRightIcon}
            nestedItems={
              NestedComponent ? (
                <NestedComponent scrollbarRef={scrollbarRef} />
              ) : null
            }
            canUnfurl={item.canUnfurl}
            restriction={item.restriction}
            disabled={item.disabled}
          />
        )
      }

      return (
        <LeftNavLink
          key={item.label}
          leftIcon={item.leftIcon}
          rightIcon={item.rightIcon}
          to={item.to}
          disabled={item.disabled}
          restriction={item.restriction}
          hasNotification={item.hasNotification}
        >
          {item.label}
        </LeftNavLink>
      )
    },
    [scrollbarRef]
  )

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
            <Flex
              direction='column'
              flex='1 1 auto'
              css={{ overflow: 'hidden' }}
            >
              {navConfig.map((item, index) => {
                const isLastMainItem = index === navConfig.length - 2
                return (
                  <Fragment key={item.label}>
                    {renderNavItem(item)}
                    {isLastMainItem ? (
                      <Box mv='s'>
                        <Divider />
                      </Box>
                    ) : null}
                  </Fragment>
                )
              })}
            </Flex>
          </DragAutoscroller>
        </Scrollbar>
      </Flex>
      {!isTransitioning ? (
        <Flex direction='column' alignItems='center'>
          <ProfileCompletionPanel />
          <LeftNavCTA />
          <NowPlayingArtworkTile />
        </Flex>
      ) : null}
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
