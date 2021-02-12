import React, { useCallback } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'

import RemixCard from 'components/remix/RemixCard'
import { ID } from 'models/common/Identifiers'
import { AppState } from 'store/types'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUserFromTrack } from 'store/cache/users/selectors'
import { SquareSizes } from 'models/common/ImageSizes'
import { withNullGuard } from 'utils/withNullGuard'
import { useUserProfilePicture, useTrackCoverArt } from 'hooks/useImageSize'
import { trackPage, profilePage } from 'utils/route'

type OwnProps = {
  trackId: ID
}

type ConnectedRemixCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard(
  ({ track, user, ...p }: ConnectedRemixCardProps) =>
    track && user && { ...p, track, user }
)

const ConnectedRemixCard = g(({ track, user, goToRoute }) => {
  const profilePictureImage = useUserProfilePicture(
    user.user_id,
    user._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  const coverArtImage = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )
  const goToTrackPage = useCallback(() => {
    goToRoute(trackPage(user.handle, track.title, track.track_id))
  }, [goToRoute, track, user])
  const goToArtistPage = useCallback(() => {
    goToRoute(profilePage(user.handle))
  }, [goToRoute, user])

  return (
    <RemixCard
      profilePictureImage={profilePictureImage}
      coverArtImage={coverArtImage}
      coSign={track._co_sign}
      artistName={user.name}
      artistHandle={user.handle}
      onClick={goToTrackPage}
      onClickArtistName={goToArtistPage}
      userId={user.user_id}
    />
  )
})

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    track: getTrack(state, { id: ownProps.trackId }),
    user: getUserFromTrack(state, { id: ownProps.trackId })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedRemixCard)
