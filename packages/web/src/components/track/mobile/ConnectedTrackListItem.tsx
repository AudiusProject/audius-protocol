import { memo, useCallback } from 'react'

import {
  RepostSource,
  FavoriteSource,
  ID,
  isContentUSDCPurchaseGated,
  ModalSource
} from '@audius/common/models'
import {
  accountSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  gatedContentActions,
  mobileOverflowMenuUIActions,
  OverflowAction,
  OverflowSource,
  PurchaseableContentType,
  gatedContentSelectors,
  usePremiumContentPurchaseModal,
  cacheTracksSelectors
} from '@audius/common/store'
import { push as pushRoute } from 'connected-react-router'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useModalState } from 'common/hooks/useModalState'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'
import { AppState } from 'store/types'

import TrackListItem, {
  TrackItemAction,
  TrackListItemProps
} from './TrackListItem'
const { setLockedContentId } = gatedContentActions

const { getGatedContentStatusMap } = gatedContentSelectors

const { open } = mobileOverflowMenuUIActions
const { getUserFromTrack } = cacheUsersSelectors
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack } =
  tracksSocialActions
const getUserId = accountSelectors.getUserId
const { getTrack } = cacheTracksSelectors

type OwnProps = TrackListItemProps
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedTrackListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedTrackListItem = (props: ConnectedTrackListItemProps) => {
  const {
    clickOverflow,
    currentUserId,
    ddexApp,
    hasStreamAccess,
    isUnlisted,
    isLocked,
    isReposted,
    isSaved,
    streamConditions,
    trackId,
    isDeleted,
    user,
    albumBacklink
  } = props
  const dispatch = useDispatch()
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const [, setLockedContentVisibility] = useModalState('LockedContent')
  const openLockedContentModal = useCallback(() => {
    dispatch(setLockedContentId({ id: trackId }))
    setLockedContentVisibility(true)
  }, [dispatch, trackId, setLockedContentVisibility])

  const isOwner = user?.user_id === currentUserId
  const onClickOverflow = () => {
    const overflowActions = [
      isPurchase && !hasStreamAccess && !isDeleted
        ? OverflowAction.PURCHASE_TRACK
        : null,
      isLocked || isUnlisted
        ? null
        : isReposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST,
      isLocked || isUnlisted
        ? null
        : isSaved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE,
      user?.user_id === currentUserId && !ddexApp
        ? OverflowAction.ADD_TO_ALBUM
        : null,
      !isUnlisted || isOwner ? OverflowAction.ADD_TO_PLAYLIST : null,
      OverflowAction.VIEW_TRACK_PAGE,
      albumBacklink ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]
    clickOverflow(trackId, overflowActions)
  }

  const isPurchase = isContentUSDCPurchaseGated(streamConditions)
  const onClickGatedUnlockPill = useRequiresAccountOnClick(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        {
          contentId: trackId,
          contentType: PurchaseableContentType.TRACK
        },
        { source: ModalSource.TrackListItem }
      )
    } else if (trackId && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    trackId,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    openLockedContentModal
  ])

  return (
    <TrackListItem
      {...props}
      isPremium={isPurchase}
      onClickOverflow={onClickOverflow}
      onClickGatedUnlockPill={onClickGatedUnlockPill}
      trackItemAction={TrackItemAction.Overflow}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  const id = ownProps.trackId
  return {
    user: getUserFromTrack(state, { id: ownProps.trackId }),
    currentUserId: getUserId(state),
    gatedContentStatus: id ? getGatedContentStatusMap(state)[id] : undefined,
    albumBacklink: getTrack(state, { id: ownProps.trackId })?.album_backlink
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    saveTrack: (trackId: ID) =>
      dispatch(saveTrack(trackId, FavoriteSource.TRACK_LIST)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.TRACK_LIST)),
    repostTrack: (trackId: ID) =>
      dispatch(repostTrack(trackId, RepostSource.TRACK_LIST)),
    unrepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.TRACK_LIST)),
    clickOverflow: (trackId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.TRACKS, id: trackId, overflowActions })
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackListItem))
