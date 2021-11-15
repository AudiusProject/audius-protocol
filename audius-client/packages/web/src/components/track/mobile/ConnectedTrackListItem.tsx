import React, { memo } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FavoriteSource, RepostSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { getUserId } from 'common/store/account/selectors'
import { getUserFromTrack } from 'common/store/cache/users/selectors'
import {
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack
} from 'common/store/social/tracks/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/actions'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { useFlag } from 'containers/remote-config/hooks'
import { FeatureFlags } from 'services/remote-config'
import { AppState } from 'store/types'

import TrackListItem, { TrackListItemProps } from './TrackListItem'

type OwnProps = Omit<TrackListItemProps, 'userId'>
type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>

type ConnectedTrackListItemProps = OwnProps & StateProps & DispatchProps

const ConnectedTrackListItem = (props: ConnectedTrackListItemProps) => {
  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const isOwner = props.currentUserId === props.user?.user_id

  const onClickOverflow = () => {
    const overflowActions = [
      props.isReposted ? OverflowAction.UNREPOST : OverflowAction.REPOST,
      props.isSaved ? OverflowAction.UNFAVORITE : OverflowAction.FAVORITE,
      OverflowAction.SHARE,
      isShareSoundToTikTokEnabled && isOwner
        ? OverflowAction.SHARE_TO_TIKTOK
        : null,
      OverflowAction.ADD_TO_PLAYLIST,
      OverflowAction.VIEW_TRACK_PAGE,
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
      dispatch(open(OverflowSource.TRACKS, trackId, overflowActions))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackListItem))
