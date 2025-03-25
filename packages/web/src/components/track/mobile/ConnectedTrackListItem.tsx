import { memo, useCallback } from 'react'

import { useCurrentUserId, useTrack, useUser } from '@audius/common/api'
import {
  ID,
  RepostSource,
  ModalSource,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import {
  gatedContentActions,
  gatedContentSelectors,
  mobileOverflowMenuUIActions,
  tracksSocialActions,
  usePremiumContentPurchaseModal,
  OverflowAction,
  PurchaseableContentType,
  OverflowSource
} from '@audius/common/store'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useModalState } from 'common/hooks/useModalState'
import TrackListItem, {
  TrackItemAction,
  TrackListItemProps
} from 'components/track/mobile/TrackListItem'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'

const { setLockedContentId } = gatedContentActions

const { getGatedContentStatusMap } = gatedContentSelectors

const { open } = mobileOverflowMenuUIActions
const { repostTrack, undoRepostTrack } = tracksSocialActions

type OwnProps = TrackListItemProps
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedTrackListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedTrackListItem = (props: ConnectedTrackListItemProps) => {
  const {
    clickOverflow,
    ddexApp,
    hasStreamAccess,
    isUnlisted,
    isLocked,
    isReposted,
    isSaved,
    streamConditions,
    trackId,
    isDeleted
  } = props
  const { data: currentUserId } = useCurrentUserId()
  const { data: track } = useTrack(trackId, {
    select: (track) => {
      return {
        ownerId: track?.owner_id,
        albumBacklink: track?.album_backlink
      }
    }
  })
  const { ownerId, albumBacklink } = track ?? {}
  const { data: user } = useUser(ownerId)
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
    gatedContentStatus: id ? getGatedContentStatusMap(state)[id] : undefined
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(push(route)),
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
