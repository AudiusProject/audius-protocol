import React, { memo } from 'react'
import { connect } from 'react-redux'
import TrackListItem, { TrackListItemProps } from './TrackListItem'
import { push as pushRoute } from 'connected-react-router'
import { Dispatch } from 'redux'
import {
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack
} from 'store/social/tracks/actions'
import {
  OverflowAction,
  OverflowSource
} from 'store/application/ui/mobileOverflowModal/types'
import { open } from 'store/application/ui/mobileOverflowModal/actions'

import { ID } from 'models/common/Identifiers'
import { FavoriteSource, RepostSource } from 'services/analytics'
import { AppState } from 'store/types'
import { getUserFromTrack } from 'store/cache/users/selectors'

type OwnProps = Omit<TrackListItemProps, 'userId'>
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedTrackListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedTrackListItem = (props: ConnectedTrackListItemProps) => {
  const onClickOverflow = () => {
    const overflowActions = [
      props.isReposted ? OverflowAction.UNREPOST : OverflowAction.REPOST,
      props.isSaved ? OverflowAction.UNFAVORITE : OverflowAction.FAVORITE,
      OverflowAction.SHARE,
      OverflowAction.ADD_TO_PLAYLIST,
      OverflowAction.VIEW_TRACK_PAGE,
      OverflowAction.VIEW_ARTIST_PAGE
    ]
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
    user: getUserFromTrack(state, { id: ownProps.trackId })
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
      dispatch(open(OverflowSource.TRACKS, trackId, overflowActions))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackListItem))
