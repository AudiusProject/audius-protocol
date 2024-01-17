import { memo } from 'react'

import {
  ID,
  FavoriteSource,
  RepostSource,
  accountSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions,
  FeatureFlags
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import { trpc } from 'utils/trpcClientWeb'

import TrackListItem, { TrackListItemProps } from './TrackListItem'

const { open } = mobileOverflowMenuUIActions
const { getUserFromTrack } = cacheUsersSelectors
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack } =
  tracksSocialActions
const getUserId = accountSelectors.getUserId

type OwnProps = Omit<TrackListItemProps, 'userId'>
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedTrackListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedTrackListItem = (props: ConnectedTrackListItemProps) => {
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: props.trackId },
    { enabled: !!props.trackId }
  )
  const onClickOverflow = () => {
    const overflowActions = [
      props.isLocked
        ? null
        : props.isReposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      props.isLocked
        ? null
        : props.isSaved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      isEditAlbumsEnabled && props.user?.user_id === props.currentUserId
        ? OverflowAction.ADD_TO_ALBUM
        : null,
      !props.isStreamGated ? OverflowAction.ADD_TO_PLAYLIST : null,
      OverflowAction.VIEW_TRACK_PAGE,
      isEditAlbumsEnabled && albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]
    props.clickOverflow(props.trackId, overflowActions)
  }

  return (
    <TrackListItem
      {...props}
      userId={props.user?.user_id ?? 0}
      onClickOverflow={onClickOverflow}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    user: getUserFromTrack(state, { id: ownProps.trackId }),
    currentUserId: getUserId(state)
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
